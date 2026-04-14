import pandas as pd
import json

faculty_path = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'
df = pd.read_excel(faculty_path, sheet_name='Faculty Details', header=1)
cols = df.columns.tolist()
with open('faculty_cols.json', 'w') as f:
    json.dump(cols, f)
