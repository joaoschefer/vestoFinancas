from django.db import models

class Transacao(models.Model):
    TIPO_CHOICES = (
        ("entrada", "Entrada"),
        ("saida", "Saída"),
    )

    descricao = models.CharField(max_length=120)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    data = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.descricao} ({self.tipo})"


class Investimento(models.Model):
    TIPO_CHOICES = (
        ("Renda Fixa", "Renda Fixa"),
        ("Ação", "Ação"),
        ("FII", "FII"),
        ("Cripto", "Cripto"),
        ("Dolar", "Dolar"),
    )

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    data = models.DateField()

    # Para totalizar no front: sempre o valor em BRL (no Dólar = valor pago em R$)
    valor_brl = models.DecimalField(max_digits=12, decimal_places=2)

    # Identificador do ativo:
    # - Renda Fixa: nome do título
    # - Ação/FII: ticker
    # - Cripto: moeda (BTC/ETH...)
    # - Dolar: "USD"
    ativo = models.CharField(max_length=120)

    # Campos para Ação/FII/Cripto
    quantidade = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    preco_medio = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Campos para Renda Fixa
    vencimento = models.DateField(null=True, blank=True)
    taxa = models.CharField(max_length=60, blank=True, default="")

    # Campo específico do Dólar (USD comprados)
    quantidade_usd = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ativo} ({self.tipo})"