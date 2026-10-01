from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AreasViewSet, ReservaAreaViewSet

router = DefaultRouter()
router.register(r'areas', AreasViewSet, basename='areas')
router.register(r'reservas', ReservaAreaViewSet, basename='reservas')

urlpatterns = [
    path('', include(router.urls)),
]
