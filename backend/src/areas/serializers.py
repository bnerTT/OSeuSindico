from .models import Areas, ReservaArea
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Areas
        fields = '__all__'


class ReservaAreaSerializer(serializers.ModelSerializer):
    area_detalhes = AreaSerializer(source="area", read_only=True)
    morador_nome = serializers.SerializerMethodField(read_only=True)
    morador_apartamento = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ReservaArea
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

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio') or (self.instance.data_inicio if self.instance else None)
        data_fim = attrs.get('data_fim') or (self.instance.data_fim if self.instance else None)
        area = attrs.get('area') or (self.instance.area if self.instance else None)
        status_reserva = attrs.get('status', getattr(self.instance, 'status', 'pendente'))

        if not data_inicio or not data_fim:
            raise serializers.ValidationError("Os horários de início e término são obrigatórios.")

        if data_fim <= data_inicio:
            raise serializers.ValidationError({"data_fim": "O horário de término deve ser posterior ao horário de início."})

        # 1. Permite apenas datas futuras (com tolerância de 5 minutos para latência de requisições e testes)
        if not self.instance or ('data_inicio' in attrs and attrs['data_inicio'] != self.instance.data_inicio):
            agora = timezone.now()
            if data_inicio < agora - timedelta(minutes=5):
                raise serializers.ValidationError({"data_inicio": "A reserva só pode ser agendada para datas e horários futuros."})

        # 2. Impede conflitos de horário na mesma área (reservas ativas: pendente ou confirmada)
        if status_reserva in ['pendente', 'confirmada']:
            conflitos = ReservaArea.objects.filter(
                area=area,
                status__in=['pendente', 'confirmada'],
                data_inicio__lt=data_fim,
                data_fim__gt=data_inicio
            )
            if self.instance:
                conflitos = conflitos.exclude(pk=self.instance.pk)

            if conflitos.exists():
                raise serializers.ValidationError({
                    "conflito": "Esta área já possui uma reserva ativa para o intervalo de horário selecionado."
                })

        return attrs