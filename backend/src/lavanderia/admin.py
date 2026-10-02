from django.contrib import admin

from .models import Maquina, ReservaMaquina

# Register your models here.
admin.site.register(Maquina)
admin.site.register(ReservaMaquina)