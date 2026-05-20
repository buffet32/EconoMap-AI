from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class EconomicCell(models.Model):
    """Economic zone cell from dataset.csv — one row per (cell_id, sector_main)."""

    cell_id = models.CharField(max_length=32, db_index=True)
    cell_lat = models.DecimalField(max_digits=10, decimal_places=6, db_index=True)
    cell_lon = models.DecimalField(max_digits=11, decimal_places=6, db_index=True)
    city = models.CharField(max_length=128, db_index=True)
    zone_name = models.CharField(max_length=255, blank=True, default="", db_index=True)
    district = models.CharField(max_length=255, blank=True, default="")
    region_name = models.CharField(max_length=255, blank=True, default="", db_index=True)
    display_name = models.CharField(max_length=320, blank=True, default="", db_index=True)
    sector_main = models.CharField(max_length=128, db_index=True)
    entity_count_real = models.IntegerField(default=0)
    entity_count_total = models.IntegerField(default=0)
    density_log = models.FloatField(default=0.0)
    active_rate = models.FloatField(default=0.0)
    capital_median = models.FloatField(default=0.0)
    capital_mean = models.FloatField(default=0.0)
    capital_max = models.FloatField(default=0.0)
    sector_diversity = models.FloatField(default=0.0)
    formal_ratio = models.FloatField(default=0.0)
    sarl_count = models.IntegerField(default=0)
    sa_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["city", "sector_main"]),
            models.Index(fields=["cell_id", "sector_main"]),
            models.Index(fields=["display_name"]),
            models.Index(fields=["region_name", "city"]),
        ]
        unique_together = [["cell_id", "sector_main"]]
        ordering = ["cell_id", "sector_main"]

    def __str__(self):
        label = self.display_name or self.cell_id
        return f"{label} — {self.sector_main}"


class Enterprise(models.Model):
    """Economic entity from data_filtered.csv."""

    entity_name = models.CharField(max_length=512, db_index=True)
    sector = models.TextField(blank=True)
    sector_main = models.CharField(max_length=128, db_index=True)
    entity_type = models.CharField(max_length=128, blank=True)
    legal_form = models.CharField(max_length=128, blank=True)
    company_status = models.CharField(max_length=64, db_index=True)
    capital_dhs = models.FloatField(default=0.0)
    activity = models.TextField(blank=True)
    phone = models.CharField(max_length=64, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=128, db_index=True)
    region = models.CharField(max_length=128, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, db_index=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=7, db_index=True)
    source_dataset = models.CharField(max_length=64, blank=True)
    geo_cell_key = models.CharField(max_length=32, blank=True, db_index=True)
    economic_cell = models.ForeignKey(
        EconomicCell,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enterprises",
    )

    class Meta:
        indexes = [
            models.Index(fields=["city", "sector_main"]),
            models.Index(fields=["geo_cell_key"]),
            models.Index(fields=["latitude", "longitude"]),
        ]
        ordering = ["entity_name"]

    def __str__(self):
        return self.entity_name


class Entreprise(models.Model):
    nom_entreprise = models.CharField(max_length=255)
    code_ice = models.CharField(max_length=50, db_index=True)
    secteur = models.TextField()

    # Choices pour forme_juridique
    SA = 'SA'
    SARL = 'SARL'
    SNC = 'SNC'
    SCS = 'SCS'
    AUTRE = 'autre'
    FORMES_JURIDIQUES = [
        (SA, 'SA'),
        (SARL, 'SARL'),
        (SNC, 'SNC'),
        (SCS, 'SCS'),
        (AUTRE, 'Autre'),
    ]
    forme_juridique = models.CharField(max_length=10, choices=FORMES_JURIDIQUES)

    ville = models.CharField(max_length=255)
    adresse = models.TextField()

    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)

    activite = models.CharField(max_length=255)

    # Choices pour type personne
    PP = 'PP'  # Personne Physique
    PM = 'PM'  # Personne Morale
    TYPES_PERSONNE = [
        (PP, 'Personne Physique'),
        (PM, 'Personne Morale'),
    ]
    type = models.CharField(max_length=2, choices=TYPES_PERSONNE)

    email = models.EmailField(max_length=255, blank=True, null=True)
    fax = models.CharField(max_length=50, blank=True, null=True)
    site_web = models.CharField(max_length=255, blank=True, null=True)
    contact = models.CharField(max_length=255, blank=True, null=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    cnss = models.CharField(max_length=50, blank=True, null=True)
    identifiant_fiscal = models.CharField(max_length=50, blank=True, null=True, db_column='if')  # "if" est mot réservé, on met identifiant_fiscal 
    patente = models.CharField(max_length=50, blank=True, null=True)
    rc = models.CharField(max_length=50, blank=True, null=True)

    # Choices pour en_activite
    OUI = 'oui'
    NON = 'non'
    EN_ACTIVITE_CHOICES = [
        (OUI, 'Oui'),
        (NON, 'Non'),
    ]
    en_activite = models.CharField(max_length=3, choices=EN_ACTIVITE_CHOICES, default=OUI)

    date_creation = models.DateTimeField(auto_now_add=True)

    # Choices pour taille_entreprise
    PME = 'PME'
    GE = 'GE'
    SU = 'SU'
    TAILLES_ENTREPRISE = [
        (PME, 'Petite et Moyenne Entreprise'),
        (GE, 'Grande Entreprise'),
        (SU, 'Startup'),
    ]
    taille_entreprise = models.CharField(max_length=3, choices=TAILLES_ENTREPRISE)

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Le nom d'utilisateur est obligatoire")
        extra_fields.setdefault("username", username)
        user = self.model(**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', CustomUser.ADMIN)
        extra_fields.setdefault('is_premium', True)
        extra_fields.setdefault('subscription_type', 'premium')
        return self.create_user(username, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ADMIN = 'admin'
    RESPONSABLE = 'responsable'
    CLIENT = 'client'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (RESPONSABLE, 'Responsable'),
        (CLIENT, 'Client'),
    ]

    numero_telephone = models.CharField(max_length=20, blank=True, null=True)
    username = models.CharField(max_length=150, unique=True)
    numero_carte = models.CharField(max_length=50)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_premium = models.BooleanField(default=False)
    subscription_type = models.CharField(max_length=20, default='free', blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    @property
    def has_premium_access(self):
        return self.is_premium or self.role in (self.ADMIN, self.RESPONSABLE)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role', 'numero_carte']

    objects = CustomUserManager()

    def __str__(self):
        return self.numero_telephone
