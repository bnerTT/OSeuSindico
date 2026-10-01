from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Maquina, ReservaMaquina

class MaquinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maquina
        fields = '__all__'


class ReservaMaquinaSerializer(serializers.ModelSerializer):
    morador_nome = serializers.SerializerMethodField(read_only=True)
    morador_apartamento = serializers.SerializerMethodField(read_only=True)
    maquina_numero = serializers.SerializerMethodField(read_only=True)
    maquina_capacidade = serializers.SerializerMethodField(read_only=True)
    maquina_preco = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ReservaMaquina
        fields = [
            'id',
            'maquina',
            'morador',
            'horario_inicio',
            'horario_final',
            'morador_nome',
            'morador_apartamento',
            'maquina_numero',
            'maquina_capacidade',
            'maquina_preco',
        ]

    def get_morador_nome(self, obj):
        if obj.morador:
            user = obj.morador.user
            if user:
                nome_completo = f"{user.first_name} {user.last_name}".strip()
                return nome_completo if nome_completo else user.username
        return None

    def get_morador_apartamento(self, obj):
        return obj.morador.apartamento if obj.morador else None

    def get_maquina_numero(self, obj):
        return obj.maquina.numero if obj.maquina else None

    def get_maquina_capacidade(self, obj):
        return obj.maquina.capacidade if obj.maquina else None

    def get_maquina_preco(self, obj):
        return obj.maquina.preco if obj.maquina else None

    def validate(self, attrs):
        horario_inicio = attrs.get('horario_inicio') or (self.instance.horario_inicio if self.instance else None)
        horario_final = attrs.get('horario_final') or (self.instance.horario_final if self.instance else None)
        maquina = attrs.get('maquina') or (self.instance.maquina if self.instance else None)

        if not horario_inicio or not horario_final:
            raise serializers.ValidationError({
                'non_field_errors': ['Horário de início e horário final são obrigatórios.']
            })

        if horario_final <= horario_inicio:
            raise serializers.ValidationError({
                'horario_final': ['O horário final deve ser posterior ao horário de início.']
            })

        # 1. Validação de data/horário futuro (com tolerância de 5 minutos para latência de rede)
        agora = timezone.now() - timedelta(minutes=5)
        if horario_inicio < agora:
            raise serializers.ValidationError({
                'horario_inicio': ['Não é permitido agendar reservas para datas ou horários que já passaram.']
            })

        # 2. Mecanismo Anti-Colisão: impede dois moradores reservarem a mesma máquina no mesmo horário
        if maquina:
            conflitos = ReservaMaquina.objects.filter(
                maquina=maquina,
                horario_inicio__lt=horario_final,
                horario_final__gt=horario_inicio
            )

            if self.instance:
                conflitos = conflitos.exclude(id=self.instance.id)

            if conflitos.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'Esta máquina já possui uma reserva agendada para este horário. Escolha outro horário ou outra máquina.'
                    ]
                })

        return attrs