from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import PreferenciaUsuario, Transacao


class TransacaoViewSetTests(APITestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(username="usuario", password="senha123")
        self.outro_usuario = User.objects.create_user(username="outro", password="senha123")
        self.transacao_usuario = Transacao.objects.create(
            usuario=self.usuario,
            descricao="Salario",
            valor="5000.00",
            tipo="entrada",
            categoria="salario",
            data="2026-06-01",
        )
        self.transacao_outro_usuario = Transacao.objects.create(
            usuario=self.outro_usuario,
            descricao="Compra",
            valor="100.00",
            tipo="saida",
            categoria="outros",
            data="2026-06-02",
        )
        self.client.force_authenticate(user=self.usuario)

    def test_lista_apenas_transacoes_do_usuario_logado(self):
        response = self.client.get("/api/transacoes/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.transacao_usuario.id])

    def test_nova_transacao_e_vinculada_ao_usuario_logado(self):
        response = self.client.post(
            "/api/transacoes/",
            {
                "descricao": "Freelance",
                "valor": "800.00",
                "tipo": "entrada",
                "categoria": "outros",
                "data": "2026-06-03",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Transacao.objects.get(id=response.data["id"]).usuario, self.usuario)

    def test_nao_permite_excluir_transacao_de_outro_usuario(self):
        response = self.client.delete(f"/api/transacoes/{self.transacao_outro_usuario.id}/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Transacao.objects.filter(id=self.transacao_outro_usuario.id).exists())

    def test_exige_autenticacao(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/transacoes/")

        self.assertEqual(response.status_code, 401)

    def test_filtra_transacoes_por_busca_categoria_e_tipo(self):
        Transacao.objects.create(
            usuario=self.usuario,
            descricao="Mercado",
            valor="200.00",
            tipo="saida",
            categoria="alimentacao",
            data="2026-06-04",
        )

        response = self.client.get(
            "/api/transacoes/?busca=mercado&categoria=alimentacao&tipo=saida"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["descricao"], "Mercado")


class ConfiguracoesUsuarioTests(APITestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(
            username="usuario-config",
            email="antigo@example.com",
            password="senha123",
        )
        self.client.force_authenticate(user=self.usuario)

    def test_atualiza_perfil(self):
        response = self.client.patch(
            "/api/usuarios/me/",
            {"username": "novo-usuario", "email": "novo@example.com"},
            format="json",
        )
        self.usuario.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.usuario.username, "novo-usuario")
        self.assertEqual(self.usuario.email, "novo@example.com")

    def test_altera_senha_validando_senha_atual(self):
        response = self.client.post(
            "/api/usuarios/alterar-senha/",
            {"senha_atual": "senha123", "nova_senha": "novaSenha123"},
            format="json",
        )
        self.usuario.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.usuario.check_password("novaSenha123"))

    def test_cria_e_atualiza_preferencias(self):
        response = self.client.patch(
            "/api/usuarios/preferencias/",
            {"meta_economia_mensal": "1000.00", "limite_gastos_mensal": "3000.00"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        preferencias = PreferenciaUsuario.objects.get(usuario=self.usuario)
        self.assertEqual(preferencias.meta_economia_mensal, 1000)
        self.assertEqual(preferencias.limite_gastos_mensal, 3000)

    def test_exporta_transacoes_csv(self):
        Transacao.objects.create(
            usuario=self.usuario,
            descricao="Salario",
            valor="5000.00",
            tipo="entrada",
            categoria="salario",
            data="2026-06-01",
        )

        response = self.client.get("/api/transacoes/exportar/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
        self.assertIn("Salario", response.content.decode("utf-8-sig"))

    def test_exclui_conta_e_dados_relacionados(self):
        Transacao.objects.create(
            usuario=self.usuario,
            descricao="Compra",
            valor="100.00",
            tipo="saida",
            categoria="outros",
            data="2026-06-01",
        )

        response = self.client.delete("/api/usuarios/me/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.usuario.pk).exists())
        self.assertFalse(Transacao.objects.filter(usuario_id=self.usuario.pk).exists())
