from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from .models import Maquina, ReservaMaquina
from .serializers import MaquinaSerializer, ReservaMaquinaSerializer

class IsAdminOrReadOnly(BasePermission):
    """
    Permite leitura (GET, HEAD, OPTIONS) para usuários autenticados.
    Permite escrita (POST, PUT, PATCH, DELETE) apenas para administradores (staff).
    Morador não tem permissão para cadastrar/editar/excluir máquinas, apenas reservar.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)

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