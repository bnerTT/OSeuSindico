import logging
import time

logger = logging.getLogger('django.request')

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time
        
        user = request.user if hasattr(request, 'user') and request.user.is_authenticated else 'Anonimo'
        
        log_message = (
            f"[{request.method}] {request.path} | "
            f"Status: {response.status_code} | "
            f"User: {user} | "
            f"IP: {self.get_client_ip(request)} | "
            f"Tempo: {duration:.3f}s"
        )

        if response.status_code >= 500:
            logger.error(log_message)
        elif response.status_code >= 400:
            logger.warning(log_message)
        else:
            logger.info(log_message)

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')