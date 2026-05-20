import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='client').exists():
    User.objects.create_user(
        numero_telephone='0622222222',
        password='client123',
        username='client',
        role='client',
        numero_carte='CLIENT001'
    )
    print("Client user created successfully!")
    print("Username: client")
    print("Password: client123")
else:
    print("Client user already exists!")
    print("Username: client")
    print("Password: client123")
