from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0007_add_smart_timetable_models"),
        ("users", "0005_add_branch_field"),
    ]

    operations = [
        migrations.AddField(
            model_name="faculty",
            name="class_course",
            field=models.ForeignKey(
                blank=True,
                help_text="Course for which this faculty is class teacher",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="class_teachers",
                to="academics.course",
            ),
        ),
        migrations.AddField(
            model_name="faculty",
            name="class_semester",
            field=models.IntegerField(
                blank=True,
                default=1,
                help_text="Semester for which this faculty is class teacher",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="faculty",
            name="is_class_teacher",
            field=models.BooleanField(
                default=False,
                help_text="Whether this faculty is a class teacher",
            ),
        ),
    ]
