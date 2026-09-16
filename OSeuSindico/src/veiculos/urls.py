from django.urls import path
from .views import veiculos_api, veiculos_api_detalhe

urlpatterns = [
    path("veiculos/", veiculos_api, name="api veiculos"),
    path("veiculos/<int:pk>/", veiculos_api_detalhe, name="api veiculos id"),
]
