from django.contrib.auth.models import User
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Transacao
from .serializers import TransacaoSerializer, UsuarioRegistroSerializer, UsuarioLogadoSerializer

class RegistrarUsuarioView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioRegistroSerializer
    permission_classes = [AllowAny]

class UsuarioLogadoView(generics.RetrieveAPIView):
    serializer_class = UsuarioLogadoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    queryset = Transacao.objects.all().order_by("-data", "-created_at")

    def get_queryset(self):
        qs = super().get_queryset()
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")

        if data_inicio:
            qs = qs.filter(data__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data__lte=data_fim)

        return qs
