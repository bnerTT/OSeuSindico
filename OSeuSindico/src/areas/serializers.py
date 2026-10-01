from .models import Areas, ReservaArea
from rest_framework import serializers
from django.contrib.auth.models import User


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Areas
        fields = '__all__'
        
class ReservaAreaSerializer(serializers.ModelSerializer):
    area_detalhes = AreaSerializer(source="area", read_only=True)
    
    class Meta:
        model = ReservaArea
        fields = '__all__'