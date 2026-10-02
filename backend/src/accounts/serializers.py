from .models import Morador
from rest_framework import serializers
from django.contrib.auth.models import User


class MoradorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    nome = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Morador
        fields = ['id', 'username', 'password', 'nome', 'cpf', 'data_nascimento', 'apartamento']

    def get_nome(self, obj):
        if hasattr(obj, 'user') and obj.user:
            full_name = obj.user.get_full_name()
            return full_name if full_name else obj.user.username
        return f"Morador {obj.apartamento}"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if hasattr(instance, 'user') and instance.user:
            ret['username'] = instance.user.username
            full_name = instance.user.get_full_name()
            ret['nome'] = full_name if full_name else instance.user.username
        return ret
        
    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(username=username, password=password)
        morador = Morador.objects.create(user=user, **validated_data)
        
        return morador
    
    def update(self, instance, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        
        if username:
            instance.user.username = username
        if password:
            instance.user.set_password(password)
        if username or password:
            instance.user.save()
            
        instance.cpf = validated_data.get('cpf', instance.cpf)
        instance.data_nascimento = validated_data.get('data_nascimento', instance.data_nascimento)
        instance.apartamento = validated_data.get('apartamento', instance.apartamento)
        instance.save()
        
        return instance
            