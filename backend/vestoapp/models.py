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
        ("investimentos", "Investimentos"),
        ("salario", "Salário"),
        ("vendas", "Vendas"),
        ("outros", "Outros"),
    )

    descricao = models.CharField(max_length=120)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.CharField(
        max_length=30,
        choices=CATEGORIA_CHOICES,
        default="outros"
    )
    data = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.descricao} ({self.tipo})"
