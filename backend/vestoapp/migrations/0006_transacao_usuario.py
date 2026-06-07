from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("vestoapp", "0005_alter_transacao_categoria"),
    ]

    operations = [
        migrations.AddField(
            model_name="transacao",
            name="usuario",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="transacoes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
