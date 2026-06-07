from django.contrib import admin

from .models import PreferenciaUsuario, Transacao


admin.site.register(Transacao)
admin.site.register(PreferenciaUsuario)
