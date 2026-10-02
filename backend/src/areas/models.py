from django.db import models

from accounts.models import Morador

# Create your models here.
class Areas(models.Model):
    nome = models.CharField(max_length=100, null=False)
    descricao = models.TextField()
    
class ReservaArea(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
    ]
    
    data_inicio = models.DateTimeField(null=False)
    data_fim = models.DateTimeField(null=False)
    morador = models.ForeignKey(Morador, on_delete=models.CASCADE)
    area = models.ForeignKey(Areas, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    criada_em = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.area.nome} reservada para {self.morador} em {self.data_inicio.strftime('%d/%m/%Y')}"