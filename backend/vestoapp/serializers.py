from rest_framework import serializers
from .models import Transacao, Investimento

class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = ["id", "descricao", "valor", "tipo", "data", "created_at"]


class InvestimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investimento
        fields = [
            "id",
            "tipo",
            "data",
            "valor_brl",
            "ativo",
            "quantidade",
            "preco_medio",
            "vencimento",
            "taxa",
            "quantidade_usd",
            "created_at",
        ]

    def validate(self, attrs):
        tipo = attrs.get("tipo") or getattr(self.instance, "tipo", None)
        if not tipo:
            raise serializers.ValidationError({"tipo": "Selecione o tipo."})

        # sempre obrigatório
        if not attrs.get("data") and not getattr(self.instance, "data", None):
            raise serializers.ValidationError({"data": "Selecione a data."})

        valor_brl = attrs.get("valor_brl", getattr(self.instance, "valor_brl", None))
        if valor_brl is None or float(valor_brl) <= 0:
            raise serializers.ValidationError({"valor_brl": "Informe um valor em BRL válido."})

        ativo = (attrs.get("ativo") or getattr(self.instance, "ativo", "") or "").strip()
        if not ativo:
            raise serializers.ValidationError({"ativo": "Informe o ativo."})

        if tipo == "Renda Fixa":
            # título obrigatório, vencimento/taxa opcionais
            return attrs

        if tipo == "Dolar":
            # Dólar: ativo deve ser USD (ajuda o front)
            attrs["ativo"] = "USD"
            qtd_usd = attrs.get("quantidade_usd", getattr(self.instance, "quantidade_usd", None))
            if qtd_usd is None or float(qtd_usd) <= 0:
                raise serializers.ValidationError({"quantidade_usd": "Informe a quantidade comprada em USD."})

            # não usar campos de outros tipos
            attrs["quantidade"] = None
            attrs["preco_medio"] = None
            attrs["vencimento"] = None
            attrs["taxa"] = attrs.get("taxa", "") or ""
            return attrs

        # Ação / FII / Cripto
        qtd = attrs.get("quantidade", getattr(self.instance, "quantidade", None))
        pm = attrs.get("preco_medio", getattr(self.instance, "preco_medio", None))
        if qtd is None or float(qtd) <= 0:
            raise serializers.ValidationError({"quantidade": "Informe uma quantidade válida."})
        if pm is None or float(pm) <= 0:
            raise serializers.ValidationError({"preco_medio": "Informe um preço médio válido."})

        # não usar campo do dólar
        attrs["quantidade_usd"] = None
        return attrs
