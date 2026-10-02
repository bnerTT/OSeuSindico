from django.urls import path
from .views import encomendas_api, encomenda_detalhe_api

urlpatterns = [
    path("encomendas/", encomendas_api, name="api encomendas"),
    path("encomendas/<int:pk>/", encomenda_detalhe_api, name="api encomendas id"),
]
