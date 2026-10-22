from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Tickets


class DisplayUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
        ]


class TicketsSerializers(serializers.ModelSerializer):
    user = DisplayUserSerializer(read_only=True)
    assigned_manager = DisplayUserSerializer(read_only=True)
    assigned_to = DisplayUserSerializer(read_only=True)

    class Meta:
        model = Tickets
        fields = [
            "id",
            "user",
            "customer_name",
            "issue_description",
            "priority",
            "status",
            "assigned_manager",
            "assigned_to",
            "resolution",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "assigned_manager",
            "assigned_to",
            "created_at",
            "updated_at",
        ]


class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "email",
        ]

        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
        )

        return user
