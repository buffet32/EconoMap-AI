from .models import Entreprise, CustomUser
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = '__all__'

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'numero_telephone', 'numero_carte', 'role', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            numero_telephone=validated_data.get('numero_telephone', ''),
            numero_carte=validated_data['numero_carte'],
            role=validated_data.get('role', 'client'),  # Default to client role
            password=validated_data['password']
        )
        return user

class CustomUserSerializer(serializers.ModelSerializer):
    is_premium = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'numero_telephone', 'numero_carte', 'role',
            'is_active', 'is_staff', 'date_joined', 'is_premium', 'subscription_type',
        )

    def get_is_premium(self, obj):
        return obj.has_premium_access

class CustomUserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'numero_telephone', 'numero_carte', 'role', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        
        # Set is_superuser based on role
        if user.role == 'admin':
            user.is_superuser = True
            user.is_staff = True
        
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update is_superuser based on role
        if instance.role == 'admin':
            instance.is_superuser = True
            instance.is_staff = True
        else:
            instance.is_superuser = False
        
        if password:
            instance.set_password(password)
        instance.save()
        return instance 