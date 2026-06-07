from django.contrib.auth.models import User
from rest_framework import serializers

from .models import PreferenciaUsuario, Transacao


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )


class UsuarioLogadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
        read_only_fields = ["id"]

    def validate_username(self, value):
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuario ja esta em uso.")
        return value


class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = ["id", "descricao", "valor", "tipo", "categoria", "data", "created_at"]


class PreferenciaUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenciaUsuario
        fields = ["meta_economia_mensal", "limite_gastos_mensal"]

    def validate_meta_economia_mensal(self, value):
        if value < 0:
            raise serializers.ValidationError("A meta nao pode ser negativa.")
        return value

    def validate_limite_gastos_mensal(self, value):
        if value < 0:
            raise serializers.ValidationError("O limite nao pode ser negativo.")
        return value


class AlterarSenhaSerializer(serializers.Serializer):
    senha_atual = serializers.CharField(write_only=True)
    nova_senha = serializers.CharField(write_only=True, min_length=6)

    def validate_senha_atual(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value
