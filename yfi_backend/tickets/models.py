
from django.db import models
from django.contrib.auth.models import User


class TicketPriority(models.TextChoices):
    HIGH = "HIGH", "High"
    MEDIUM = "MEDIUM", "Medium"
    LOW = "LOW", "Low"
    UNASSIGNED = "UNASSIGNED", "Unassigned"


class TicketStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class Tickets(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets"
    )

    customer_name = models.CharField(
        max_length=100
    )

    issue_description = models.TextField()

    priority = models.CharField(
        max_length=20,
        choices=TicketPriority.choices,
        default=TicketPriority.UNASSIGNED
    )

    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN
    )

    # Manager responsible for this ticket
    assigned_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_tickets",
        limit_choices_to={
            "groups__name": "Manager"
        }
    )

    # Engineer assigned to work on this ticket
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
        limit_choices_to={
            "groups__name": "Engineer"
        }
    )

    resolution = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Ticket #{self.id} - {self.customer_name}"


class EngineerTeamMember(models.Model):
    engineer = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="team_membership"
    )

    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="team_engineers"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        manager_name = (
            self.manager.username
            if self.manager
            else "Unassigned"
        )

        return f"{self.engineer.username} -> {manager_name}"


class AssignmentRoutingState(models.Model):
    manager = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="assignment_routing"
    )

    next_engineer_index = models.PositiveIntegerField(
        default=0
    )

    class Meta:
        verbose_name = "Assignment Routing State"
        verbose_name_plural = "Assignment Routing States"

    def __str__(self):
        return f"Routing state - {self.manager.username}"


class GlobalAssignmentRoutingState(models.Model):
    next_manager_index = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return "Global Assignment Routing State"