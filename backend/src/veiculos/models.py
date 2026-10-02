from django.db import models

from accounts.models import Morador

# Create your models here.
class Veiculos(models.Model):
    morador = models.ForeignKey(Morador, on_delete=models.CASCADE)
    placa = models.CharField(max_length=11, blank=False, null=False)
    modelo = models.CharField(max_length=11, blank=False, null=False)
    cor = models.CharField(max_length=11, blank=False, null=False)
            