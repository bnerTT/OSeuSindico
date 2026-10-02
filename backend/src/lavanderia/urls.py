from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaquinaViewSet, ReservaMaquinaViewSet

router = DefaultRouter()
router.register(r'maquinas', MaquinaViewSet, basename='maquinas')
router.register(r'reservas-maquinas', ReservaMaquinaViewSet, basename='reservas-maquinas')

urlpatterns = [
    path('maquinas/reservas/', ReservaMaquinaViewSet.as_view({'get': 'list', 'post': 'create'}), name='maquinas-reservas-list'),
    path('maquinas/reservas/<int:pk>/', ReservaMaquinaViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='maquinas-reservas-detail'),
    path('', include(router.urls)),
]
