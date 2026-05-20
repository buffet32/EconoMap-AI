from django.core.management.base import BaseCommand
from entreprise.models import CustomUser

DEMO_USERS = [
    {
        "username": "admin",
        "password": "Admin123!",
        "role": CustomUser.ADMIN,
        "numero_carte": "ADM-001",
        "numero_telephone": "0600000001",
        "is_premium": True,
        "subscription_type": "premium",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "premium",
        "password": "Premium123!",
        "role": CustomUser.CLIENT,
        "numero_carte": "PRM-001",
        "numero_telephone": "0600000002",
        "is_premium": True,
        "subscription_type": "premium",
    },
    {
        "username": "client",
        "password": "Client123!",
        "role": CustomUser.CLIENT,
        "numero_carte": "CLI-001",
        "numero_telephone": "0600000003",
        "is_premium": False,
        "subscription_type": "free",
    },
    {
        "username": "responsable",
        "password": "Resp123!",
        "role": CustomUser.RESPONSABLE,
        "numero_carte": "RSP-001",
        "numero_telephone": "0600000004",
        "is_premium": True,
        "subscription_type": "premium",
        "is_staff": True,
    },
]


class Command(BaseCommand):
    help = "Create demo users for authentication and premium AI features testing."

    def handle(self, *args, **options):
        for spec in DEMO_USERS:
            data = {**spec}
            username = data["username"]
            password = data.pop("password")
            is_superuser = data.pop("is_superuser", False)
            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults=data,
            )
            if not created:
                for key, val in data.items():
                    setattr(user, key, val)
            user.set_password(password)
            if is_superuser:
                user.is_superuser = True
            user.save()
            status = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"{status}: {username}"))

        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Demo credentials:"))
        self.stdout.write("  admin / Admin123!       (admin + premium)")
        self.stdout.write("  premium / Premium123!   (premium AI access)")
        self.stdout.write("  responsable / Resp123!  (responsable + premium)")
        self.stdout.write("  client / Client123!     (standard, no premium)")
