"""
Analytics Views (currently empty - all logic in API views)
"""

from django.shortcuts import render
from django.views.generic import TemplateView


class AnalyticsDashboardView(TemplateView):
    """Analytics dashboard view - for future use"""
    template_name = 'analytics/dashboard.html'
