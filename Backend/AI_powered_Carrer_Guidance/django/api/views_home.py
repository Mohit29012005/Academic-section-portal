"""
Home view - serves the frontend UI
"""
from django.shortcuts import render
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def home(request):
    """Serve the main UI"""
    return render(request, 'index.html')
