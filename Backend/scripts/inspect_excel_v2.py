import pandas as pd

faculty_path = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'
student_path = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Students.xlsx'

def check_sheets(path, name):
    xl = pd.ExcelFile(path)
    print(f"--- {name} Sheets ---")
    print(xl.sheet_names)
    for sheet in xl.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet)
        print(f"Sheet '{sheet}' Columns: {df.columns.tolist()[:5]}...")
        print(f"Sheet '{sheet}' Head:\n{df.head(2)}")

check_sheets(faculty_path, "Faculty")
check_sheets(student_path, "Student")
