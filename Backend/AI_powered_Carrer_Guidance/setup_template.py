import os
import re

# Read Flask HTML
with open(r'c:\Evolvex-AI\frontend\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace static file references for Django
html = html.replace('href="styles.css"',  'href="{% static \'styles.css\' %}"')
html = html.replace('src="app.js"', 'src="{% static \'app.js\' %}"')

# Add Django load static tag at top
html = '{% load static %}\n' + html

# Write to Django templates
os.makedirs(r'c:\Evolvex-AI\evolvex_django\templates', exist_ok=True)
with open(r'c:\Evolvex-AI\evolvex_django\templates\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ Full Flask UI template created successfully')
