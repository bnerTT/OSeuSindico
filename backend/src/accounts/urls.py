from django.urls import path
from .views import id_moradores_api, moradores_api,me_api

urlpatterns = [
    path("moradores/", moradores_api, name="api moradores"),
    path("moradores/<int:pk>/", id_moradores_api, name="api moradores id"),
    path('api/moradores/me/', me_api, name='me_api'),
]
