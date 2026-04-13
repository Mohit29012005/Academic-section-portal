import pickle

model_path = "AI_Powered_Exam_Paper_Generator/ml/exam_paper_model.pkl"
model = pickle.load(open(model_path, "rb"))

print("=== ML Model Info ===")
print("Keys:", list(model.keys()))
print()

print("=== Clusters ===")
clusters = model.get("clusters", {})
print("Clusters count:", len(clusters))

print("=== Semester Subjects ===")
print("sem_subjects:", model.get("sem_subjects"))
print()

print("=== Subject Data ===")
sd = model.get("subject_data", {})
print("Total subjects:", len(sd))

# Show sample
count = 0
for k, v in sd.items():
    print(f"  Subject {k}: {len(v)} questions")
    count += 1
    if count >= 5:
        break

print()
print("=== Threshold ===")
print("threshold:", model.get("threshold"))
