from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Areas, ReservaArea
from .serializers import AreaSerializer, ReservaAreaSerializer

class AreasViewSet(viewsets.ModelViewSet):
    queryset = Areas.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]

class ReservaAreaViewSet(viewsets.ModelViewSet):
    queryset = ReservaArea.objects.all()
    serializer_class = ReservaAreaSerializer
    permission_classes = [IsAuthenticated]