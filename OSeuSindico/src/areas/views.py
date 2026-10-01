from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from .models import Areas, ReservaArea
from .serializers import AreaSerializer, ReservaAreaSerializer

class IsAdminOrReadOnly(BasePermission):
    """
    Permite leitura (GET, HEAD, OPTIONS) para usuários autenticados.
    Permite escrita (POST, PUT, PATCH, DELETE) para administradores.
    Um usuário é considerado administrador se:
    1. For staff (is_staff=True) ou superuser (is_superuser=True), OU
    2. Não possuir perfil de Morador vinculado (usuário de gestão/portaria/admin).
    Moradores comuns com perfil de morador vinculado são restritos exclusivamente à leitura de áreas e realização de reservas.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff or request.user.is_superuser:
            return True
        from accounts.models import Morador
        return not Morador.objects.filter(user=request.user).exists()

class AreasViewSet(viewsets.ModelViewSet):
    queryset = Areas.objects.all().order_by('nome')
    serializer_class = AreaSerializer
    permission_classes = [IsAdminOrReadOnly]

class ReservaAreaViewSet(viewsets.ModelViewSet):
    serializer_class = ReservaAreaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ReservaArea.objects.all()
        area_id = self.request.query_params.get('area')
        morador_id = self.request.query_params.get('morador')
        status_param = self.request.query_params.get('status')
        data_param = self.request.query_params.get('data')

        if area_id:
            queryset = queryset.filter(area_id=area_id)
        if morador_id:
            queryset = queryset.filter(morador_id=morador_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if data_param:
            queryset = queryset.filter(data_inicio__date=data_param)

        return queryset.order_by('data_inicio')