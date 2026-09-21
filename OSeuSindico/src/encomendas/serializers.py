from .models import Encomendas
from rest_framework import serializers

class EncomendasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomendas
        fields = '__all__'