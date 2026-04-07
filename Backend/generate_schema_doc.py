import os
import django
from django.conf import settings
from django.apps import apps
from pprint import pprint

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

def generate_markdown():
    output_lines = []
    output_lines.append("# Updated ERP Database Schema")
    output_lines.append("This document outlines the current active database schema, including all tables, fields, and explicit foreign key relationships as defined by the application models.")
    output_lines.append("\n---\n")

    project_apps = ['users', 'academics', 'attendance', 'pyqs', 'AI_Powered_Exam_Paper_Generator']
    
    table_count = 0

    for app_name in project_apps:
        app_config = apps.get_app_config(app_name)
        models = app_config.get_models()
        
        output_lines.append(f"## Module: {app_name.upper()}")
        output_lines.append("")
        
        for model in models:
            table_count += 1
            table_name = model._meta.db_table
            model_name = model.__name__
            output_lines.append(f"### Table {table_count}: `{table_name}` (Model: {model_name})")
            output_lines.append(f"**Purpose:** Central storage for {model_name} related data.")
            output_lines.append("")
            output_lines.append("| Field Name | Data Type | Constraints & Relations | Description |")
            output_lines.append("|------------|-----------|-------------------------|-------------|")
            
            for field in model._meta.get_fields():
                # Skip reverse relations unless they are actual fields
                if field.auto_created and not field.concrete:
                    continue
                
                field_name = field.name
                
                # Handling data type and attributes
                field_type = field.__class__.__name__
                constraints = []
                if getattr(field, 'primary_key', False):
                    constraints.append("**PRIMARY KEY**")
                if getattr(field, 'unique', False):
                    constraints.append("UNIQUE")
                if getattr(field, 'null', False):
                    constraints.append("NULLABLE")
                else:
                    constraints.append("NOT NULL")
                
                # Relations
                description = f"Standard field for {field_name}"
                if field.is_relation and field.related_model:
                    rel_table = field.related_model._meta.db_table
                    rel_type = type(field).__name__
                    if "ForeignKey" in rel_type or "OneToOne" in rel_type:
                        constraints.append(f"**FOREIGN KEY → `{rel_table}`**")
                        description = f"Links to `{rel_table}` (Relationship: {rel_type})"
                    elif "ManyToManyField" in rel_type:
                        constraints.append(f"**MANY-TO-MANY → `{rel_table}`**")
                        description = f"Many-to-Many linking to `{rel_table}`"
                        
                constraint_str = ", ".join(constraints)
                output_lines.append(f"| `{field_name}` | {field_type} | {constraint_str} | {description} |")
            
            output_lines.append("")
            output_lines.append("---\n")

    output_lines.insert(2, f"**Total Active Tables Defined:** {table_count}\n")
    
    with open(os.path.join(settings.BASE_DIR, '..', 'Current_Database_Schema.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))

if __name__ == "__main__":
    generate_markdown()
    print("Schema documentation successfully generated!")
