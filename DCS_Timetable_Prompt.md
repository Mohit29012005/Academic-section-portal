# GANPAT University - DCS Timetable Generation Prompt

## For: ChatGPT / Claude / Any AI Assistant

---

## PROMPT TO COPY AND USE:

```
Create a weekly class timetable for Ganpat University - Department of Computer Science (DCS).

## IMPORTANT: ROOM ASSIGNMENT IS MANDATORY
Every class (each semester of each course) MUST have its own dedicated room.
Format: SUBJECT (FACULTY) @ ROOM

Example: WD1 (HCP) @ C-101

---

## SHIFT SYSTEM (DUAL SHIFT):

### Morning Shift (8:00 AM - 1:00 PM)
Courses: BTECH-IT, BTECH-CSE, MCA, MSc-IT, MSc-IMS, MSc-CYBER, MSc-AIML

Time Slots (Mon-Fri):
| Slot | Start | End | Type |
|------|-------|-----|------|
| 1 | 08:00 | 08:55 | Lecture |
| 2 | 08:55 | 09:40 | Lecture |
| BREAK | 09:40 | 10:00 | Tea Break |
| 3 | 10:15 | 11:10 | Lecture |
| 4 | 11:10 | 12:00 | Lecture |
| 5 | 12:00 | 12:55 | Lecture |
| 6 | 12:55 | 13:00 | Lecture |

### Noon Shift (12:00 PM - 6:10 PM)
Courses: BCA, BSc-IT, BSc-IMS, BSc-CYBER, BSc-AIML

Time Slots (Mon-Fri):
| Slot | Start | End | Type |
|------|-------|-----|------|
| 1 | 12:00 | 12:55 | Lecture |
| 2 | 12:55 | 13:25 | Lecture |
| 3 | 13:25 | 14:20 | Lecture |
| LUNCH | 14:20 | 15:15 | Lunch Break |
| 4 | 15:15 | 16:10 | Lecture |
| TEA | 16:10 | 16:30 | Tea Break |
| 5 | 16:30 | 17:20 | Lecture |
| 6 | 17:20 | 18:10 | Lecture |

### Saturday Schedule:
- Morning: Shorter day (4 slots), starts 8:30 AM
- Noon: Same as weekday but Slot 1 is extended (11:05-12:55)

---

## ROOM ALLOCATION (DEDICATED ROOMS FOR EACH CLASS):

Each semester-class gets ONE dedicated room for the entire semester.

### Morning Shift Rooms (for BTECH + Masters):
| Semester Class | Room | Room Type |
|---------------|------|-----------|
| BTECH-IT S1 | C-101 | Lecture Hall |
| BTECH-IT S3 | C-102 | Lecture Hall |
| BTECH-IT S5 | C-103 | Lecture Hall |
| BTECH-IT S7 | C-104 | Lecture Hall |
| BTECH-CSE S1 | C-105 | Lecture Hall |
| BTECH-CSE S3 | C-106 | Lecture Hall |
| BTECH-CSE S5 | C-107 | Lecture Hall |
| BTECH-CSE S7 | C-108 | Lecture Hall |
| MCA S1 | C-201 | Lecture Hall |
| MCA S3 | C-202 | Lecture Hall |
| MSc-IT S1 | C-203 | Lecture Hall |
| MSc-IT S3 | C-204 | Lecture Hall |
| MSc-IMS S1 | CS Lab-1 | Computer Lab |
| MSc-IMS S3 | CS Lab-2 | Computer Lab |
| MSc-CYBER S1 | Cyber Lab | Computer Lab |
| MSc-CYBER S3 | AI Lab | Computer Lab |
| MSc-AIML S1 | ML Lab | Computer Lab |
| MSc-AIML S3 | IMS Lab | Computer Lab |

### Noon Shift Rooms (for BCA + BSc):
| Semester Class | Room | Room Type |
|---------------|------|-----------|
| BCA S1 | A-101 | Lecture Hall |
| BCA S3 | A-102 | Lecture Hall |
| BCA S5 | A-103 | Lecture Hall |
| BSc-IT S1 | A-104 | Lecture Hall |
| BSc-IT S3 | A-105 | Lecture Hall |
| BSc-IT S5 | A-106 | Lecture Hall |
| BSc-IMS S1 | A-107 | Lecture Hall |
| BSc-IMS S3 | A-108 | Lecture Hall |
| BSc-IMS S5 | A-201 | Lecture Hall |
| BSc-CYBER S1 | A-202 | Lecture Hall |
| BSc-CYBER S3 | A-203 | Lecture Hall |
| BSc-CYBER S5 | A-204 | Lecture Hall |
| BSc-AIML S1 | A-205 | Lecture Hall |
| BSc-AIML S3 | A-206 | Lecture Hall |
| BSc-AIML S5 | A-207 | Lecture Hall |

---

## COURSES AND SUBJECTS:

### [PASTE YOUR COURSE-SUBJECT-FACULTY DATA HERE]

Format:
| Course | Semester | Subject Code | Subject Name | Faculty Code |
|--------|----------|--------------|--------------|-------------|
| BCA | 1 | WD1 | Web Development | HCP |
| BCA | 1 | ITS | IT Skills | RRS |
... (add all subjects)

---

## REQUIREMENTS:

1. **MANDATORY ROOM**: Every cell must include room number. Format: SUBJECT (FAC) @ ROOM
   Example: WD1 (HCP) @ A-101

2. Each subject must be scheduled 2-3 times per week

3. Same faculty CANNOT take 2 classes at same time

4. Each semester-class has its OWN dedicated room (see room table above)

5. Same room CANNOT be used by two classes at same time

6. Lab subjects (practical) must use Computer Labs

7. Theory subjects use Lecture Halls

8. Breaks (Lunch/Tea) must be same for all classes

9. Faculty teaching multiple courses must have no slot conflicts

---

## OUTPUT FORMAT (WITH ROOM NUMBERS):

Create the timetable in this exact format:

```
### Course: [COURSE NAME] - Semester [SEM]
Shift: [MORNING/NOON]
Room: [ASSIGNED ROOM FROM TABLE ABOVE]

| Time | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday |
|------|--------|---------|-----------|----------|--------|----------|
| Slot 1 | SUBJECT (FAC) @ ROOM | ... | ... | ... | ... | ... |
| Slot 2 | SUBJECT (FAC) @ ROOM | ... | ... | ... | ... | ... |
| BREAK | BREAK | BREAK | BREAK | BREAK | BREAK | BREAK |
| Slot 3 | SUBJECT (FAC) @ ROOM | ... | ... | ... | ... | ... |
| Slot 4 | SUBJECT (FAC) @ ROOM | ... | ... | ... | ... | ... |
... continue for all slots
```

## EXAMPLE OUTPUT:

```
### Course: MCA - Semester 1
Shift: MORNING
Room: C-201

| Time | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday |
|------|--------|---------|-----------|----------|--------|----------|
| 08:00-08:55 | PP (BBP) @ C-201 | FM (PA) @ C-201 | DMS (PDP) @ C-201 | JP (NKD) @ C-201 | DMS (PDP) @ C-201 | AI (NIP) @ C-201 |
| 08:55-09:40 | FM (PA) @ C-201 | DMS (PDP) @ C-201 | JP (NKD) @ C-201 | DMS (PDP) @ C-201 | PP (BBP) @ C-201 | ML1 (DKR) @ C-201 |
| 09:40-10:00 | BREAK | BREAK | BREAK | BREAK | BREAK | BREAK |
| 10:15-11:10 | JP (NKD) @ C-201 | PP (BBP) @ C-201 | FM (PA) @ C-201 | PP (BBP) @ C-201 | LFM (JND) @ C-201 | BDS (BBP) @ CS Lab-1 |
| 11:10-12:00 | DMS (PDP) @ C-201 | JP (NKD) @ C-201 | PP (BBP) @ C-201 | LFM (JND) @ C-201 | JP (NKD) @ C-201 | PYT (PDP) @ CS Lab-1 |
| 12:00-12:55 | LFM (JND) @ C-201 | LFM (JND) @ C-201 | JP (NKD) @ C-201 | FM (PA) @ C-201 | DMS (PDP) @ C-201 | - |
| 12:55-13:00 | - | - | - | - | - | - |
```

---

## NOTES:
- Each semester-class has a DEDICATED ROOM (from the room table)
- Include room in EVERY cell: SUBJECT (FAC) @ ROOM
- BTECH and Masters students may share some faculty
- BSc courses (BCA, BSc) have separate faculty
- Lab subjects (practicals) MUST use Computer Labs
```

---

## WHAT TO FILL IN:

### Step 1: Get Subject Data from Your System

Run this in Django shell:
```bash
python manage.py shell
```

Then paste:
```python
from academics.models import Subject
for s in Subject.objects.all().select_related('course', 'faculty_members'):
    faculties = ", ".join([f.employee_id for f in s.faculty_members.all()])
    print(f"{s.course.code}|{s.semester}|{s.code}|{s.name}|{faculties}")
```

### Step 2: Copy the output and paste in the PROMPT section

### Step 3: Generate timetable using ChatGPT/Claude

---

## SAMPLE DATA (from your timetable):

| Course | Sem | Subject Code | Subject Name | Faculty Code |
|--------|-----|-------------|--------------|-------------|
| BCA | 1 | WD1 | Web Development | HCP |
| BCA | 1 | ITS | IT Skills | RRS |
| BCA | 1 | DADM | Database Management | JDP |
| BCA | 1 | ADP | Advanced Programming | DBB |
| BCA | 1 | CS1 | Computer System | BRP |
| BCA | 1 | IDE | Integrated Development | HCP |
| BCA | 5 | WPF | Web Programming | CP |
| BCA | 5 | OPS | Operating System | DK |
| BCA | 5 | IML | Image ML | CP |
| BCA | 5 | SAD | Software Architecture | JNP |
| MCA | 1 | PP | Python Programming | BBP |
| MCA | 1 | FM | Frontend Mobile | PA |
| MCA | 1 | DMS | Data Science | PDP |
| MCA | 1 | JP | Java Programming | NKD |
| BSc-IT | 1 | WD1 | Web Development | HCP |
| BSc-IT | 1 | ITS | IT Skills | RRS |
| BSc-IT | 1 | DADM | Database | JDP |
| BSc-IT | 1 | ADP | Programming | DBB |
| BSc-IT | 5 | WPF | Web Programming | CP |
| BSc-IT | 5 | OPS | Operating System | DK |

---

## ROOM TABLE (to include in prompt):

```
## DEDICATED ROOMS FOR EACH CLASS:

### Morning Shift (BTECH + Masters):
- BTECH-IT S1: C-101 | BTECH-IT S3: C-102 | BTECH-IT S5: C-103 | BTECH-IT S7: C-104
- BTECH-CSE S1: C-105 | BTECH-CSE S3: C-106 | BTECH-CSE S5: C-107 | BTECH-CSE S7: C-108
- MCA S1: C-201 | MCA S3: C-202
- MSc-IT S1: C-203 | MSc-IT S3: C-204
- MSc-IMS S1: CS Lab-1 | MSc-IMS S3: CS Lab-2
- MSc-CYBER S1: Cyber Lab | MSc-CYBER S3: AI Lab
- MSc-AIML S1: ML Lab | MSc-AIML S3: IMS Lab

### Noon Shift (BCA + BSc):
- BCA S1: A-101 | BCA S3: A-102 | BCA S5: A-103
- BSc-IT S1: A-104 | BSc-IT S3: A-105 | BSc-IT S5: A-106
- BSc-IMS S1: A-107 | BSc-IMS S3: A-108 | BSc-IMS S5: A-201
- BSc-CYBER S1: A-202 | BSc-CYBER S3: A-203 | BSc-CYBER S5: A-204
- BSc-AIML S1: A-205 | BSc-AIML S3: A-206 | BSc-AIML S5: A-207
```

---

## TIPS FOR BETTER RESULTS:

1. **Include Room in EVERY cell**: SUBJECT (FAC) @ ROOM
2. **Start with one shift**: Generate Morning shift courses first
3. **Check for conflicts**: No faculty overlap at same time
4. **Balance workload**: Each subject 2-3 times per week
5. **Lab = Computer Lab**: Practical subjects in labs

---

## After AI Generates the Timetable:

1. Copy the generated timetable
2. Share with us - we'll convert it to system import format
3. System will create all timetable slots with rooms assigned

---

**Need help? Share the AI-generated timetable here and we'll import it into the system!**
