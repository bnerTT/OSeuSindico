from .models import Encomendas
from rest_framework import serializers

class EncomendasSerializer(serializers.ModelSerializer):
    morador_nome = serializers.SerializerMethodField(read_only=True)
    morador_apartamento = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Encomendas
        fields = '__all__'

    def get_morador_nome(self, obj):
        if hasattr(obj, 'morador') and obj.morador:
            if hasattr(obj.morador, 'user') and obj.morador.user:
                full_name = obj.morador.user.get_full_name()
                return full_name if full_name else obj.morador.user.username
            return f"Morador {obj.morador.apartamento}"
        return "Morador"

    def get_morador_apartamento(self, obj):
        if hasattr(obj, 'morador') and obj.morador:
            return obj.morador.apartamento
        return ""