from django.db import models
from accounts.models import Morador

# Create your models here.
class Encomendas(models.Model):
    codigo = models.CharField(max_length=50, blank=False)
    morador = models.ForeignKey(Morador, on_delete=models.DO_NOTHING)
    data_chegada = models.DateTimeField(auto_now_add=True)
    data_retirada = models.DateTimeField(blank=True)