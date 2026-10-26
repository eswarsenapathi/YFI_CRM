import logging

from django.contrib.auth.models import User, Group
from django.db import transaction
from django.db.models import Q, Case, When, Value, IntegerField

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import (
    Tickets,
    EngineerTeamMember,
    GlobalAssignmentRoutingState,
)
from .serializers import TicketsSerializers, RegisterUserSerializer

logger = logging.getLogger(__name__)


class TicketPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 50


def get_user_role(user):
    if user.groups.filter(name="Admin").exists():
        return "Admin"
    if user.groups.filter(name="Manager").exists():
        return "Manager"
    if user.groups.filter(name="Engineer").exists():
        return "Engineer"
    return "Customer"


def get_role_based_tickets(user):
    role = get_user_role(user)

    if role == "Admin":
        return Tickets.objects.all()
    if role == "Manager":
        # Show tickets owned by this Manager, plus tickets assigned to an
        # Engineer on this Manager's team when manager ownership is still NULL.
        # Do not expose tickets already owned by another Manager.
        return Tickets.objects.filter(
            Q(assigned_manager=user)
            | Q(
                assigned_manager__isnull=True,
                assigned_to__team_membership__manager=user,
            )
        ).distinct()
    if role == "Engineer":
        return Tickets.objects.filter(assigned_to=user)
    return Tickets.objects.filter(user=user)


def get_next_manager():
    """Return the next active Manager using round-robin assignment.

    Call this function from inside transaction.atomic().
    """
    managers = list(
        User.objects.filter(
            groups__name="Manager",
            is_active=True,
        ).distinct().order_by("id")
    )

    if not managers:
        return None

    state, _ = GlobalAssignmentRoutingState.objects.get_or_create(pk=1)
    state = GlobalAssignmentRoutingState.objects.select_for_update().get(pk=state.pk)

    index = state.next_manager_index % len(managers)
    manager = managers[index]

    state.next_manager_index = (index + 1) % len(managers)
    state.save(update_fields=["next_manager_index", "updated_at"])

    return manager

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def home(request):
    try:
        if request.method == "GET":
            tickets = get_role_based_tickets(request.user)

            search = request.GET.get("search")
            if search:
                tickets = tickets.filter(
                    Q(customer_name__icontains=search)
                    | Q(issue_description__icontains=search)
                )

            customer_name = request.GET.get("customer_name")
            if customer_name:
                tickets = tickets.filter(customer_name__icontains=customer_name)

            priority = request.GET.get("priority")
            if priority:
                tickets = tickets.filter(priority=priority)

            ticket_status = request.GET.get("status")
            if ticket_status:
                tickets = tickets.filter(status=ticket_status)

            sort = request.GET.get("sort")
            if sort == "oldest":
                tickets = tickets.order_by("created_at")
            elif sort == "priority":
                tickets = tickets.annotate(
                    priority_order=Case(
                        When(priority="HIGH", then=Value(1)),
                        When(priority="MEDIUM", then=Value(2)),
                        When(priority="LOW", then=Value(3)),
                        When(priority="UNASSIGNED", then=Value(4)),
                        default=Value(5),
                        output_field=IntegerField(),
                    )
                ).order_by("priority_order", "-created_at")
            else:
                tickets = tickets.order_by("-created_at")

            paginator = TicketPagination()
            page = paginator.paginate_queryset(tickets, request)
            serializer = TicketsSerializers(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # POST: customers create tickets. The Manager is assigned automatically.
        if get_user_role(request.user) != "Customer":
            return Response(
                {"detail": "Only customers can create support tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TicketsSerializers(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            manager = get_next_manager()
            ticket = serializer.save(
                user=request.user,
                status="OPEN",
                assigned_to=None,
                assigned_manager=manager,
            )

        message = (
            "Ticket created successfully and assigned to a Manager."
            if manager
            else "Ticket created successfully. No active Manager is available, so this ticket is unassigned."
        )
        return Response(
            {"message": message, "ticket": TicketsSerializers(ticket).data},
            status=status.HTTP_201_CREATED,
        )
    except Exception:
        logger.exception("Unhandled error in tickets.home for user_id=%s method=%s", getattr(request.user, "id", None), request.method)
        return Response(
            {"detail": "An internal server error occurred while processing tickets."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def get_single_ticket(request, id):
    try:
        ticket = Tickets.objects.select_related(
            "user", "assigned_manager", "assigned_to"
        ).get(id=id)
    except Tickets.DoesNotExist:
        return Response(
            {"detail": "Ticket not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    role = get_user_role(request.user)

    if role == "Admin":
        has_access = True
    elif role == "Manager":
        is_own_ticket = ticket.assigned_manager_id == request.user.id
        is_unassigned_team_ticket = (
            ticket.assigned_manager_id is None
            and ticket.assigned_to_id is not None
            and EngineerTeamMember.objects.filter(
                engineer_id=ticket.assigned_to_id,
                manager=request.user,
            ).exists()
        )
        has_access = is_own_ticket or is_unassigned_team_ticket
    elif role == "Engineer":
        has_access = ticket.assigned_to_id == request.user.id
    else:
        has_access = ticket.user_id == request.user.id

    if not has_access:
        return Response(
            {"detail": "You do not have permission to access this ticket."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        return Response(TicketsSerializers(ticket).data)

    if request.method == "PATCH":
        if role == "Customer":
            return Response(
                {"detail": "Customers cannot update existing tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )

        received_fields = set(request.data.keys())
        assignment_fields = {"assigned_manager", "assigned_to", "engineer_id"}
        if received_fields & assignment_fields:
            return Response(
                {
                    "detail": (
                        "Ticket assignments must be changed through the "
                        "appropriate assignment workflow."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if role == "Engineer":
            allowed_fields = {"status", "resolution"}
            invalid_fields = received_fields - allowed_fields
            if invalid_fields:
                return Response(
                    {
                        "detail": "Engineers can update only status and resolution.",
                        "invalid_fields": sorted(invalid_fields),
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = TicketsSerializers(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        if role != "Admin":
            return Response(
                {"detail": "Only Admin can delete tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ticket.delete()
        return Response(
            {"message": "Ticket deleted successfully."},
            status=status.HTTP_200_OK,
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def assign_ticket(request, id):
    role = get_user_role(request.user)

    # Admin can manage users and teams, but cannot assign Engineers to tickets.
    if role != "Manager":
        return Response(
            {"detail": "Only Managers can assign tickets to Engineers."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        ticket = Tickets.objects.get(id=id)
    except Tickets.DoesNotExist:
        return Response(
            {"detail": "Ticket not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if ticket.assigned_manager_id != request.user.id:
        return Response(
            {"detail": "Managers can assign only tickets assigned to them."},
            status=status.HTTP_403_FORBIDDEN,
        )

    engineer_id = request.data.get("engineer_id")
    if not engineer_id:
        return Response(
            {"detail": "engineer_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        engineer = User.objects.get(id=engineer_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Engineer not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not engineer.is_active:
        return Response(
            {"detail": "The selected Engineer account is inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not engineer.groups.filter(name="Engineer").exists():
        return Response(
            {"detail": "Selected user is not an Engineer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not EngineerTeamMember.objects.filter(
        engineer=engineer,
        manager=request.user,
    ).exists():
        return Response(
            {
                "detail": (
                    "Managers can assign tickets only to Engineers in their own team."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    ticket.assigned_to = engineer
    ticket.save(update_fields=["assigned_to", "updated_at"])

    return Response(
        {
            "message": "Ticket assigned successfully.",
            "ticket": TicketsSerializers(ticket).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def engineer_list(request):
    role = get_user_role(request.user)
    if role not in ["Admin", "Manager"]:
        return Response(
            {"detail": "Only Admin or Manager can view the Engineer list."},
            status=status.HTTP_403_FORBIDDEN,
        )

    engineers = User.objects.filter(
        groups__name="Engineer",
        is_active=True,
    ).distinct()

    if role == "Manager":
        engineers = engineers.filter(
            team_membership__manager=request.user
        )

    engineers = engineers.order_by("username")
    engineer_data = []

    for engineer in engineers:
        membership = (
            EngineerTeamMember.objects.filter(engineer=engineer)
            .select_related("manager")
            .first()
        )
        engineer_data.append(
            {
                "id": engineer.id,
                "username": engineer.username,
                "email": engineer.email,
                "manager": (
                    membership.manager.username
                    if membership and membership.manager
                    else "Unassigned"
                ),
            }
        )

    return Response(engineer_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    role = get_user_role(request.user)
    tickets = get_role_based_tickets(request.user)

    return Response(
        {
            "role": role,
            "total_tickets": tickets.count(),
            "open_tickets": tickets.filter(status="OPEN").count(),
            "in_progress_tickets": tickets.filter(status="IN_PROGRESS").count(),
            "resolved_tickets": tickets.filter(status="RESOLVED").count(),
            "closed_tickets": tickets.filter(status="CLOSED").count(),
            "unassigned_tickets": tickets.filter(assigned_to__isnull=True).count(),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterUserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "message": "Customer registration successful.",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    role = get_user_role(request.user)
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": role,
        }
    )


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def user_management(request):
    if get_user_role(request.user) != "Admin":
        return Response(
            {"detail": "Only Admin can manage users."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        users = User.objects.all().order_by("username")
        user_data = []
        for user in users:
            user_data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": get_user_role(user),
                    "is_active": user.is_active,
                }
            )
        return Response(user_data)

    if request.method == "POST":
        username = request.data.get("username")
        email = request.data.get("email", "")
        password = request.data.get("password")
        new_role = request.data.get("role")

        if not username:
            return Response(
                {"detail": "Username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_role not in ["Admin", "Manager", "Engineer"]:
            return Response(
                {"detail": "Role must be Admin, Manager or Engineer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            group = Group.objects.get(name=new_role)
        except Group.DoesNotExist:
            return Response(
                {
                    "detail": (
                        f"The '{new_role}' group does not exist. "
                        "Create the role groups before adding users."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        user.groups.add(group)

        if new_role == "Admin":
            user.is_staff = True
            user.save(update_fields=["is_staff"])

        return Response(
            {
                "message": "User created successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": new_role,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    user_id = request.data.get("user_id")
    if not user_id:
        return Response(
            {"detail": "user_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_to_delete = User.objects.get(id=user_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if user_to_delete.id == request.user.id:
        return Response(
            {"detail": "You cannot delete your own account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    delete_role = get_user_role(user_to_delete)

    if delete_role == "Customer":
        deleted_username = user_to_delete.username
        user_to_delete.delete()
        return Response(
            {
                "message": (
                    f"Customer '{deleted_username}' deleted successfully. "
                    "Their tickets were preserved."
                )
            },
            status=status.HTTP_200_OK,
        )

    if delete_role == "Engineer":
        replacement_engineers = list(
            User.objects.filter(
                groups__name="Engineer",
                is_active=True,
            ).exclude(id=user_to_delete.id).distinct().order_by("id")
        )
        engineer_tickets = Tickets.objects.filter(assigned_to=user_to_delete)
        ticket_count = engineer_tickets.count()

        if ticket_count and not replacement_engineers:
            return Response(
                {
                    "detail": (
                        "This Engineer has assigned tickets, but no other active "
                        "Engineer is available for reassignment. Create another "
                        "Engineer first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted_username = user_to_delete.username
        with transaction.atomic():
            if replacement_engineers:
                for index, ticket in enumerate(engineer_tickets):
                    ticket.assigned_to = replacement_engineers[
                        index % len(replacement_engineers)
                    ]
                    ticket.save(update_fields=["assigned_to", "updated_at"])
            user_to_delete.delete()

        return Response(
            {
                "message": f"Engineer '{deleted_username}' deleted successfully.",
                "reassigned_tickets": ticket_count,
            },
            status=status.HTTP_200_OK,
        )

    if delete_role == "Manager":
        manager_engineers = list(
            EngineerTeamMember.objects.filter(manager=user_to_delete).select_related(
                "engineer"
            )
        )
        engineer_count = len(manager_engineers)
        deleted_username = user_to_delete.username

        with transaction.atomic():
            # Engineers stay active; only their Manager assignment is cleared.
            for team_member in manager_engineers:
                team_member.manager = None
                team_member.save(update_fields=["manager"])
            # Tickets remain in the database. assigned_manager becomes NULL
            # because the model field uses on_delete=models.SET_NULL.
            user_to_delete.delete()

        return Response(
            {
                "message": (
                    f"Manager '{deleted_username}' deleted successfully."
                ),
                "unassigned_engineers": engineer_count,
                "engineers_moved_to": "Unassigned",
                "tickets_preserved": True,
            },
            status=status.HTTP_200_OK,
        )

    if delete_role == "Admin":
        deleted_username = user_to_delete.username
        user_to_delete.delete()
        return Response(
            {"message": f"Admin '{deleted_username}' deleted successfully."},
            status=status.HTTP_200_OK,
        )

    return Response(
        {"detail": "Unable to delete this user."},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def team_management(request):
    if get_user_role(request.user) != "Admin":
        return Response(
            {"detail": "Only Admin can manage Engineer teams."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        managers = User.objects.filter(
            groups__name="Manager",
            is_active=True,
        ).distinct().order_by("username")

        manager_data = []
        for manager in managers:
            team_members = (
                EngineerTeamMember.objects.filter(
                    manager=manager,
                    engineer__is_active=True,
                )
                .select_related("engineer")
                .order_by("engineer__username")
            )

            engineers = []
            for team_member in team_members:
                ticket_count = Tickets.objects.filter(
                    assigned_to=team_member.engineer
                ).count()
                engineers.append(
                    {
                        "id": team_member.engineer.id,
                        "username": team_member.engineer.username,
                        "email": team_member.engineer.email,
                        "ticket_count": ticket_count,
                    }
                )

            manager_data.append(
                {
                    "id": manager.id,
                    "username": manager.username,
                    "email": manager.email,
                    "engineers": engineers,
                    "engineer_count": len(engineers),
                }
            )

        unassigned_members = (
            EngineerTeamMember.objects.filter(
                manager__isnull=True,
                engineer__is_active=True,
            )
            .select_related("engineer")
            .order_by("engineer__username")
        )

        unassigned_engineers = []
        for team_member in unassigned_members:
            ticket_count = Tickets.objects.filter(
                assigned_to=team_member.engineer
            ).count()
            unassigned_engineers.append(
                {
                    "id": team_member.engineer.id,
                    "username": team_member.engineer.username,
                    "email": team_member.engineer.email,
                    "ticket_count": ticket_count,
                }
            )

        # Include Engineers who have never had a team-membership record.
        membership_ids = EngineerTeamMember.objects.values_list(
            "engineer_id", flat=True
        )
        engineers_without_membership = User.objects.filter(
            groups__name="Engineer",
            is_active=True,
        ).exclude(id__in=membership_ids).distinct().order_by("username")

        for engineer in engineers_without_membership:
            unassigned_engineers.append(
                {
                    "id": engineer.id,
                    "username": engineer.username,
                    "email": engineer.email,
                    "ticket_count": Tickets.objects.filter(
                        assigned_to=engineer
                    ).count(),
                }
            )

        return Response(
            {
                "managers": manager_data,
                "unassigned_engineers": unassigned_engineers,
            }
        )

    engineer_id = request.data.get("engineer_id")
    manager_id = request.data.get("manager_id")

    if not engineer_id:
        return Response(
            {"detail": "engineer_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not manager_id:
        return Response(
            {"detail": "manager_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        engineer = User.objects.get(id=engineer_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Engineer not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        manager = User.objects.get(id=manager_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Manager not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not engineer.is_active:
        return Response(
            {"detail": "The selected Engineer account is inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not manager.is_active:
        return Response(
            {"detail": "The selected Manager account is inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not engineer.groups.filter(name="Engineer").exists():
        return Response(
            {"detail": "Selected user is not an Engineer."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not manager.groups.filter(name="Manager").exists():
        return Response(
            {"detail": "Selected user is not a Manager."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Update the Engineer's team and restore ownership of tickets that became
    # unassigned when their previous Manager was deleted. Do not change tickets
    # that already belong to another Manager.
    with transaction.atomic():
        team_member, _ = EngineerTeamMember.objects.get_or_create(engineer=engineer)
        team_member.manager = manager
        team_member.save(update_fields=["manager"])

        restored_ticket_count = Tickets.objects.filter(
            assigned_to=engineer,
            assigned_manager__isnull=True,
        ).update(assigned_manager=manager)

    return Response(
        {
            "message": (
                f"Engineer '{engineer.username}' assigned to Manager "
                f"'{manager.username}'."
            ),
            "engineer": engineer.username,
            "manager": manager.username,
            "tickets_linked_to_manager": restored_ticket_count,
        },
        status=status.HTTP_200_OK,
    )
