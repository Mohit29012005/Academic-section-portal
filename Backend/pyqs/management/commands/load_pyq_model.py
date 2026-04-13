from django.core.management.base import BaseCommand
import os
import pickle
import pandas as pd


class Command(BaseCommand):
    help = "Load PYQ model into memory"

    def handle(self, *args, **options):
        from pyqs import apps as pyqs_apps

        COMPREHENSIVE_MODEL_PATH = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            ),
            "pyqs",
            "ml",
            "comprehensive_model.pkl",
        )

        if not os.path.exists(COMPREHENSIVE_MODEL_PATH):
            self.stdout.write(
                self.style.ERROR(f"Model not found: {COMPREHENSIVE_MODEL_PATH}")
            )
            return

        with open(COMPREHENSIVE_MODEL_PATH, "rb") as f:
            model_data = pickle.load(f)

        pyqs_apps.PyqsConfig.clusters = model_data.get("clusters", {})
        pyqs_apps.PyqsConfig.sem_subjects = model_data.get("sem_subjects", {})
        pyqs_apps.PyqsConfig.model_loaded = True

        for k, v in model_data.get("subject_data", {}).items():
            pyqs_apps.PyqsConfig.subject_data[k] = pd.DataFrame(v)

        total_subjects = len(
            set(k.split("_", 1)[1] for k in pyqs_apps.PyqsConfig.clusters.keys())
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"PYQ Model loaded: {len(pyqs_apps.PyqsConfig.sem_subjects)} semesters, {total_subjects} subjects"
            )
        )
