from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save

# Create your models here.


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    cpf = models.CharField(max_length=11, blank=True)
    data_nascimento = models.DateField()


class Morador(Profile):
    apartamento = models.CharField(max_length=10, blank=False, null=False)

    def criar_novo_morador(username, password, cpf, data_nascimento, apto):
        novo_user = User.objects.create_user(
            username=username,
            password=password
        )

        novo_morador = Morador.objects.create(
            user=novo_user,
            cpf=cpf,
            data_nascimento=data_nascimento,
            apartamento=apto
        )

        return novo_morador


class Sindico(Profile):

    def criar_novo_sindico(username, password, cpf, data_nascimento):
        novo_user = User.objects.create_user(
            username=username,
            password=password
        )

        novo_sindico = Sindico.objects.create(
            user=novo_user,
            cpf=cpf,
            data_nascimento=data_nascimento
        )

        return novo_sindico


class Porteiro(Profile):
    def criar_novo_porteiro(username, password, cpf, data_nascimento):
        novo_user = User.objects.create_user(
            username=username,
            password=password
        )

        novo_porteiro = Porteiro.objects.create(
            user=novo_user,
            cpf=cpf,
            data_nascimento=data_nascimento
        )

        return novo_porteiro
