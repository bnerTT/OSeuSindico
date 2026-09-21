from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import Morador
from .models import Encomendas

class EncomendasAPITests(APITestCase):
    
    def setUp(self):
        self.url = '/encomendas/'
        
        self.usuario_staff = User.objects.create_user(username="portaria", password="123", is_staff=True)
        self.client.force_authenticate(user=self.usuario_staff)
        
        self.usuario_morador = User.objects.create_user(username="morador_encomenda", password="123")
        self.morador = Morador.objects.create(
            user=self.usuario_morador,
            cpf="11122233344",
            data_nascimento="1990-01-01",
            apartamento="205A"
        )
        
        self.dados_nova_encomenda = {
            "codigo": "BR123456789BR",
            "morador": self.morador.id
        }

    def test_criar_encomenda(self):
        resposta = self.client.post(self.url, self.dados_nova_encomenda, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Encomendas.objects.count(), 1)

    def test_listar_encomendas(self):
        self.client.post(self.url, self.dados_nova_encomenda, format="json")
        resposta = self.client.get(self.url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.json()), 1)

    def test_detalhar_encomenda(self):
        self.client.post(self.url, self.dados_nova_encomenda, format="json")
        encomenda = Encomendas.objects.first()
        url_detalhe = f'{self.url}{encomenda.id}/'
        
        resposta = self.client.get(url_detalhe)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data['codigo'], "BR123456789BR")

    def test_editar_encomenda(self):
        self.client.post(self.url, self.dados_nova_encomenda, format="json")
        encomenda = Encomendas.objects.first()
        url_detalhe = f'{self.url}{encomenda.id}/'
        
        dados_atualizados = self.dados_nova_encomenda.copy()
        dados_atualizados['data_retirada'] = "2026-09-16T19:00:00Z" 
        
        resposta = self.client.put(url_detalhe, dados_atualizados, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        
        encomenda.refresh_from_db()
        self.assertIsNotNone(encomenda.data_retirada)

    def test_deletar_encomenda(self):
        self.client.post(self.url, self.dados_nova_encomenda, format="json")
        encomenda = Encomendas.objects.first()
        url_detalhe = f'{self.url}{encomenda.id}/'
        
        resposta = self.client.delete(url_detalhe)
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Encomendas.objects.count(), 0)