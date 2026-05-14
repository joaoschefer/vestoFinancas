from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Transacao

class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        usuario = User.objects.create_user(
            username = validated_data["username"],
            email = validated_data.get("email", ""),
            password = validated_data["password"]
        )
        return usuario

class UsuarioLogadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]

class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = ["id", "descricao", "valor", "tipo", "categoria", "data", "created_at"]
