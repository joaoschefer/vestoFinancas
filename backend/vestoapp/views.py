import csv

from django.contrib.auth.models import User
from django.http import HttpResponse
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import PreferenciaUsuario, Transacao
from .serializers import (
    AlterarSenhaSerializer,
    PreferenciaUsuarioSerializer,
    TransacaoSerializer,
    UsuarioLogadoSerializer,
    UsuarioRegistroSerializer,
)


class RegistrarUsuarioView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioRegistroSerializer
    permission_classes = [AllowAny]


class UsuarioLogadoView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UsuarioLogadoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AlterarSenhaView(generics.GenericAPIView):
    serializer_class = AlterarSenhaSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["nova_senha"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Senha alterada com sucesso."})


class PreferenciaUsuarioView(generics.RetrieveUpdateAPIView):
    serializer_class = PreferenciaUsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preferencias, _ = PreferenciaUsuario.objects.get_or_create(usuario=self.request.user)
        return preferencias


class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [IsAuthenticated]
    queryset = Transacao.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset().filter(usuario=self.request.user).order_by("-data", "-created_at")
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        busca = self.request.query_params.get("busca")
        categoria = self.request.query_params.get("categoria")
        tipo = self.request.query_params.get("tipo")

        if data_inicio:
            queryset = queryset.filter(data__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data__lte=data_fim)
        if busca:
            queryset = queryset.filter(descricao__icontains=busca)
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class ExportarTransacoesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="transacoes.csv"'
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(["Descricao", "Valor", "Tipo", "Categoria", "Data"])
        for transacao in Transacao.objects.filter(usuario=request.user).order_by("-data", "-created_at"):
            writer.writerow([
                transacao.descricao,
                transacao.valor,
                transacao.get_tipo_display(),
                transacao.get_categoria_display(),
                transacao.data.isoformat(),
            ])
        return response
