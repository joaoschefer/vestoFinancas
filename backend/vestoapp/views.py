import csv
import calendar
from datetime import date

from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import PreferenciaUsuario, Transacao, TransacaoRecorrente
from .serializers import (
    AlterarSenhaSerializer,
    PreferenciaUsuarioSerializer,
    TransacaoSerializer,
    TransacaoRecorrenteSerializer,
    UsuarioLogadoSerializer,
    UsuarioRegistroSerializer,
)


def data_da_recorrencia(ano, mes, dia):
    return date(ano, mes, min(dia, calendar.monthrange(ano, mes)[1]))


def proximo_mes(data_atual, dia):
    if data_atual.month == 12:
        return data_da_recorrencia(data_atual.year + 1, 1, dia)
    return data_da_recorrencia(data_atual.year, data_atual.month + 1, dia)


def primeira_data_recorrente(dia, hoje):
    data_este_mes = data_da_recorrencia(hoje.year, hoje.month, dia)
    return data_este_mes if data_este_mes >= hoje else proximo_mes(data_este_mes, dia)


@transaction.atomic
def gerar_transacoes_recorrentes(usuario):
    hoje = timezone.localdate()
    recorrencias = TransacaoRecorrente.objects.select_for_update().filter(
        usuario=usuario,
        ativa=True,
    )
    for recorrencia in recorrencias:
        if not recorrencia.proxima_data:
            recorrencia.proxima_data = primeira_data_recorrente(recorrencia.dia_do_mes, hoje)

        while recorrencia.proxima_data <= hoje:
            Transacao.objects.get_or_create(
                recorrencia=recorrencia,
                data=recorrencia.proxima_data,
                defaults={
                    "usuario": usuario,
                    "descricao": recorrencia.descricao,
                    "valor": recorrencia.valor,
                    "tipo": recorrencia.tipo,
                    "categoria": recorrencia.categoria,
                },
            )
            recorrencia.proxima_data = proximo_mes(recorrencia.proxima_data, recorrencia.dia_do_mes)

        recorrencia.save(update_fields=["proxima_data"])


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
        gerar_transacoes_recorrentes(self.request.user)
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


class TransacaoRecorrenteViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoRecorrenteSerializer
    permission_classes = [IsAuthenticated]
    queryset = TransacaoRecorrente.objects.all()

    def get_queryset(self):
        gerar_transacoes_recorrentes(self.request.user)
        return super().get_queryset().filter(usuario=self.request.user).order_by("-ativa", "dia_do_mes", "descricao")

    def perform_create(self, serializer):
        hoje = timezone.localdate()
        recorrencia = serializer.save(
            usuario=self.request.user,
            proxima_data=primeira_data_recorrente(serializer.validated_data["dia_do_mes"], hoje),
        )
        gerar_transacoes_recorrentes(self.request.user)
        recorrencia.refresh_from_db()

    def perform_update(self, serializer):
        recorrencia = serializer.save()
        recorrencia.proxima_data = primeira_data_recorrente(recorrencia.dia_do_mes, timezone.localdate())
        recorrencia.save(update_fields=["proxima_data"])
        gerar_transacoes_recorrentes(self.request.user)


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
