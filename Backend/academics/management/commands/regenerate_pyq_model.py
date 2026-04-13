from django.core.management.base import BaseCommand
from academics.models import Course, Subject
from pyqs.question_bank import SUBJECT_TOPIC_MAPPING, COMMON_TOPICS
import pandas as pd
import pickle
import os


class Command(BaseCommand):
    help = "Generate comprehensive question bank for all courses and subjects"

    def handle(self, *args, **options):
        self.stdout.write("Generating comprehensive question bank for ALL subjects...")

        question_bank = {
            "clusters": {},
            "subject_data": {},
            "sem_subjects": {},
            "threshold": 0.5,
        }

        total_subjects = 0
        total_questions = 0

        # Process all courses and semesters
        for course in Course.objects.filter(status="Active").order_by("code"):
            for sem in range(1, (course.total_semesters or 8) + 1):
                subjects = Subject.objects.filter(course=course, semester=sem)
                if not subjects.exists():
                    continue

                sem_key = str(sem)
                if sem_key not in question_bank["sem_subjects"]:
                    question_bank["sem_subjects"][sem_key] = {}

                for subj in subjects:
                    key = f"{sem}_{subj.code}"
                    subject_name = subj.name.upper()

                    # Find matching topic
                    matched_topic = None
                    for topic, keywords in SUBJECT_TOPIC_MAPPING.items():
                        for keyword in keywords:
                            if keyword.upper() in subject_name:
                                matched_topic = topic
                                break
                        if matched_topic:
                            break

                    if not matched_topic:
                        matched_topic = "programming"  # Default

                    base_questions = COMMON_TOPICS.get(
                        matched_topic, COMMON_TOPICS["programming"]
                    )
                    questions = []

                    for i, q_text in enumerate(base_questions):
                        questions.append(
                            {
                                "question": q_text,
                                "topic": matched_topic,
                                "repeat": 5
                                if i < 3
                                else (3 if i < 8 else (2 if i < 12 else 1)),
                                "years": [2024, 2023, 2022]
                                if i < 3
                                else ([2024, 2023] if i < 8 else [2024]),
                                "importance": "HIGH"
                                if i < 5
                                else ("MEDIUM" if i < 10 else "NORMAL"),
                            }
                        )

                    # Add to sem_subjects
                    question_bank["sem_subjects"][sem_key][subj.code] = subj.name

                    # Create DataFrame
                    df_data = {
                        "Semester": {i: sem for i in range(len(questions))},
                        "Subject_Code": {i: subj.code for i in range(len(questions))},
                        "Subject_Name": {i: subj.name for i in range(len(questions))},
                        "Year": {
                            i: questions[i]["years"][0] for i in range(len(questions))
                        },
                        "Question_Number": {
                            i: f"{i + 1}(a)" for i in range(len(questions))
                        },
                        "Question_Text": {
                            i: questions[i]["question"] for i in range(len(questions))
                        },
                        "Marks": {i: 5 for i in range(len(questions))},
                        "Processed": {
                            i: questions[i]["question"].lower()
                            for i in range(len(questions))
                        },
                    }
                    question_bank["subject_data"][key] = pd.DataFrame(df_data)

                    # Create clusters
                    clusters = {}
                    for i, q in enumerate(questions):
                        clusters[f"cluster_{i}"] = {
                            "representative": q["question"],
                            "count": q["repeat"],
                            "year_count": len(q["years"]),
                            "freq_score": q["repeat"] * len(q["years"]),
                            "years": q["years"],
                            "importance": q["importance"],
                            "topic": q["topic"],
                        }
                    question_bank["clusters"][key] = clusters

                    total_subjects += 1
                    total_questions += len(questions)

                    self.stdout.write(
                        f"  {course.code} Sem{sem}: {subj.code} ({matched_topic}) - {len(questions)} questions"
                    )

        # Save model
        model_path = "C:/Academic-module/Backend/pyqs/ml/comprehensive_model.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(question_bank, f)

        self.stdout.write(self.style.SUCCESS(f"\nModel saved successfully!"))
        self.stdout.write(f"  Total semesters: {len(question_bank['sem_subjects'])}")
        self.stdout.write(f"  Total subjects: {total_subjects}")
        self.stdout.write(f"  Total questions: {total_questions}")
        self.stdout.write(f"  Model path: {model_path}")
