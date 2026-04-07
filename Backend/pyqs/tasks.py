import os
from celery import shared_task
from django.utils import timezone


@shared_task
def delete_pyq_pdf(pyq_request_id):
    """Delete PYQ PDF after 24 hours."""
    from .models import PYQGenerationRequest
    try:
        pyq = PYQGenerationRequest.objects.get(request_id=pyq_request_id)
        if pyq.generated_pdf:
            filepath = pyq.generated_pdf.path
            if os.path.exists(filepath):
                os.remove(filepath)
            pyq.deleted_at = timezone.now()
            pyq.save()
    except PYQGenerationRequest.DoesNotExist:
        pass
