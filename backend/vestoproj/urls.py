from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from vestoapp.views import (
    AlterarSenhaView,
    ExportarTransacoesView,
    PreferenciaUsuarioView,
    RegistrarUsuarioView,
    TransacaoRecorrenteViewSet,
    TransacaoViewSet,
    UsuarioLogadoView,
)


router = DefaultRouter()
router.register(r"transacoes", TransacaoViewSet, basename="transacoes")
router.register(r"recorrencias", TransacaoRecorrenteViewSet, basename="recorrencias")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/usuarios/registrar/", RegistrarUsuarioView.as_view(), name="registrar"),
    path("api/usuarios/login/", TokenObtainPairView.as_view(), name="login"),
    path("api/usuarios/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api/usuarios/me/", UsuarioLogadoView.as_view(), name="usuario-logado"),
    path("api/usuarios/alterar-senha/", AlterarSenhaView.as_view(), name="alterar-senha"),
    path("api/usuarios/preferencias/", PreferenciaUsuarioView.as_view(), name="preferencias"),
    path("api/transacoes/exportar/", ExportarTransacoesView.as_view(), name="exportar-transacoes"),
    path("api/", include(router.urls)),
]
