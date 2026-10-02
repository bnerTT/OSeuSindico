from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from .models import Maquina, ReservaMaquina
from .serializers import MaquinaSerializer, ReservaMaquinaSerializer

class IsAdminOrReadOnly(BasePermission):
    """
    Permite leitura (GET, HEAD, OPTIONS) para usuários autenticados.
    Permite escrita (POST, PUT, PATCH, DELETE) para administradores.
    Um usuário é considerado administrador se:
    1. For staff (is_staff=True) ou superuser (is_superuser=True), OU
    2. Não possuir perfil de Morador vinculado (usuário de gestão/portaria/admin).
    Moradores comuns com perfil de morador vinculado são restritos exclusivamente à leitura de máquinas e realização de reservas.
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

class MaquinaViewSet(viewsets.ModelViewSet):
    queryset = Maquina.objects.all().order_by('numero')
    serializer_class = MaquinaSerializer
    permission_classes = [IsAdminOrReadOnly]

class ReservaMaquinaViewSet(viewsets.ModelViewSet):
    queryset = ReservaMaquina.objects.all().order_by('horario_inicio')
    serializer_class = ReservaMaquinaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ReservaMaquina.objects.all()
        maquina_id = self.request.query_params.get('maquina')
        morador_id = self.request.query_params.get('morador')
        data_param = self.request.query_params.get('data')

        if maquina_id:
            queryset = queryset.filter(maquina_id=maquina_id)
        if morador_id:
            queryset = queryset.filter(morador_id=morador_id)
        if data_param:
            queryset = queryset.filter(horario_inicio__date=data_param)

        return queryset.order_by('horario_inicio')