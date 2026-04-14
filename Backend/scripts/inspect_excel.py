import pandas as pd
import os

faculty_path = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'
student_path = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Students.xlsx'

def inspect_file(path, name):
    print(f"--- {name} Data ---")
    try:
        # Load without headers first to see structure
        df_raw = pd.read_excel(path, header=None)
        print("Raw first 5 rows:")
        print(df_raw.head(10))
        
        # Often these files have a title row and then headers. 
        # Let's try to detect the header row.
        # Usually it's the first row that doesn't have "Unnamed" in all columns or something.
        # Or we just look at the raw data and decide.
    except Exception as e:
        print(f"Error reading {path}: {e}")

inspect_file(faculty_path, "Faculty")
inspect_file(student_path, "Student")
