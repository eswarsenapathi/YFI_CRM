from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='tickets_home'),

    path('register/', views.register_user, name='register_user'),
    path('me/', views.current_user, name='current_user'),

    path('dashboard-summary/', views.dashboard_summary, name='dashboard_summary'),

    path('engineers/', views.engineer_list, name='engineer_list'),

    path('user-management/', views.user_management, name='user_management'),

    path('team-management/', views.team_management, name='team_management'),

    path('<int:id>/assign/', views.assign_ticket, name='assign_ticket'),

    path('<int:id>/', views.get_single_ticket, name='ticket_detail'),
]