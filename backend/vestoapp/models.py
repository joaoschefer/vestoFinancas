from django.conf import settings
from django.db import models


class TransacaoRecorrente(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transacoes_recorrentes",
    )
    descricao = models.CharField(max_length=120)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=(
        ("entrada", "Entrada"),
        ("saida", "Saida"),
    ))
    categoria = models.CharField(max_length=30, choices=(
        ("alimentacao", "Alimentacao"),
        ("transporte", "Transporte"),
        ("moradia", "Moradia"),
        ("saude", "Saude"),
        ("educacao", "Educacao"),
        ("lazer", "Lazer"),
        ("salario", "Salario"),
        ("vendas", "Vendas"),
        ("outros", "Outros"),
    ), default="outros")
    dia_do_mes = models.PositiveSmallIntegerField()
    ativa = models.BooleanField(default=True)
    proxima_data = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.descricao} (todo dia {self.dia_do_mes})"


class Transacao(models.Model):
    TIPO_CHOICES = (
        ("entrada", "Entrada"),
        ("saida", "Saída"),
    )

    CATEGORIA_CHOICES = (
        ("alimentacao", "Alimentação"),
        ("transporte", "Transporte"),
        ("moradia", "Moradia"),
        ("saude", "Saúde"),
        ("educacao", "Educação"),
        ("lazer", "Lazer"),
        ("salario", "Salário"),
        ("vendas", "Vendas"),
        ("outros", "Outros"),
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transacoes",
        null=True,
        blank=True,
    )
    descricao = models.CharField(max_length=120)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.CharField(
        max_length=30,
        choices=CATEGORIA_CHOICES,
        default="outros",
    )
    data = models.DateField()
    recorrencia = models.ForeignKey(
        TransacaoRecorrente,
        on_delete=models.SET_NULL,
        related_name="transacoes_geradas",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["recorrencia", "data"],
                name="transacao_recorrente_unica_por_data",
            ),
        ]

    def __str__(self):
        return f"{self.descricao} ({self.tipo})"


class PreferenciaUsuario(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferencias",
    )
    meta_economia_mensal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    limite_gastos_mensal = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Preferencias de {self.usuario.username}"
