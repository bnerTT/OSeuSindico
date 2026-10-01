from django.db import models
from accounts.models import Morador

# Create your models here.
class Maquina(models.Model):
    numero = models.IntegerField()
    capacidade = models.FloatField()
    preco = models.FloatField()
    
class ReservaMaquina(models.Model):
    maquina = models.ForeignKey(Maquina, on_delete=models.CASCADE)
    morador = models.ForeignKey(Morador, on_delete=models.CASCADE)
    horario_inicio = models.DateTimeField()
    horario_final = models.DateTimeField()