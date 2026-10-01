from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Areas, ReservaArea
from .serializers import AreaSerializer, ReservaAreaSerializer

class AreasViewSet(viewsets.ModelViewSet):
    queryset = Areas.objects.all().order_by('nome')
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]

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