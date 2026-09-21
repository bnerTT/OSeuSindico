from .models import Veiculos
from rest_framework import serializers

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculos
        fields = '__all__'