from django.contrib import admin

from .models import Morador, Porteiro, Sindico

# Register your models here.
admin.site.register(Morador)
admin.site.register(Sindico)
admin.site.register(Porteiro)
