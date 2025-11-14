# Generated migration for Customer model changes

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_campaign_campaigninteraction_customer_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="customer",
            name="customer_type",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="status",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="company_website",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="industry",
        ),
        migrations.AlterField(
            model_name="customer",
            name="company_name",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Reliance Digital", "Reliance Digital"),
                    ("Titan", "Titan"),
                    ("Peter England", "Peter England"),
                    ("Bata", "Bata"),
                ],
                max_length=200,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="customer",
            name="date_of_purchase",
            field=models.DateField(auto_now_add=True, default='2025-01-01'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="customer",
            name="billing_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AlterField(
            model_name="campaign",
            name="target_customer_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Reliance Digital", "Reliance Digital"),
                    ("Titan", "Titan"),
                    ("Peter England", "Peter England"),
                    ("Bata", "Bata"),
                ],
                max_length=200,
                null=True,
            ),
        ),
        migrations.RenameField(
            model_name="campaign",
            old_name="target_customer_type",
            new_name="target_company",
        ),
    ]
