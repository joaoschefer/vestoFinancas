from rest_framework import viewsets
from .models import Transacao
from .serializers import TransacaoSerializer

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
