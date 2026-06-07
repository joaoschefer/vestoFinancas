from django.conf import settings
from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True)

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
