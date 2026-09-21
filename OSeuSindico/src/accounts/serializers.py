from .models import Morador
from rest_framework import serializers
from django.contrib.auth.models import User


class MoradorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Morador
        fields = ['id', 'username', 'password', 'cpf', 'data_nascimento', 'apartamento']
        
    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(username=username,password=password)
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
            