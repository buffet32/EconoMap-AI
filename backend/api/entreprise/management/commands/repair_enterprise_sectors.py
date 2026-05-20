from __future__ import annotations

from collections import Counter

from django.core.management.base import BaseCommand

from entreprise.models import Enterprise
from entreprise.services.sector_normalization import normalize_sector_main

INVALID_VALUES = {"", "nan", "none", "null", "n/a", "-", "unknown"}


class Command(BaseCommand):
    help = "Repair invalid enterprise.sector_main values from raw sector labels."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Show changes without writing.")
        parser.add_argument("--batch-size", type=int, default=2000)

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        batch_size = max(200, int(options["batch_size"]))

        qs = Enterprise.objects.all().only("id", "sector_main", "sector")
        to_update = []
        stats = Counter()
        scanned = 0

        for ent in qs.iterator(chunk_size=batch_size):
            scanned += 1
            raw = (ent.sector_main or "").strip()
            if raw.lower() not in INVALID_VALUES:
                continue

            new_value = normalize_sector_main(ent.sector_main, ent.sector)
            if not new_value or new_value.lower() in INVALID_VALUES:
                new_value = "Other"

            if new_value == ent.sector_main:
                continue

            stats[new_value] += 1
            ent.sector_main = new_value
            to_update.append(ent)

        if not dry_run and to_update:
            Enterprise.objects.bulk_update(to_update, ["sector_main"], batch_size=batch_size)

        self.stdout.write(self.style.SUCCESS(f"Scanned enterprises: {scanned}"))
        self.stdout.write(self.style.SUCCESS(f"Rows to repair: {len(to_update)}"))
        if stats:
            self.stdout.write("Repairs by target sector:")
            for sector, count in stats.most_common():
                self.stdout.write(f"  - {sector}: {count}")
        else:
            self.stdout.write("No invalid sector_main rows found.")
