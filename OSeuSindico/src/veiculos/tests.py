# Create your tests here.

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import Morador
from .models import Veiculos

# Create your tests here.
class MoradorAPITests(APITestCase):
    def setUp(self):
        self.url = '/veiculos/'
        
        self.morador_dono = Morador.objects.create(
            user=User.objects.create_user(username="dono_carro", password="123"),
            cpf="99988877766",
            data_nascimento="1980-01-01",
            apartamento="102D"
        )
        
        self.dados_novo_veiculo = {
            "morador": self.morador_dono.id,
            "placa":"QSX-1876",
            "modelo":"Sandero",
            "cor":"Prata",
        }
        
    def test_criar_veiculo(self):
        resposta = self.client.post(self.url, self.dados_novo_veiculo, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Veiculos.objects.count(), 1)
        
        
    def test_listar_veiculos(self):
        resposta = self.client.get(self.url)
        
        print("Resposta get sem post:", resposta.json())
        
        resposta = self.client.post(self.url, self.dados_novo_veiculo, format="json")
        
        resposta = self.client.get(self.url)
        
        print("Resposta get com post:", resposta.json())
        
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.json()), 1)
    
    def test_detalhar_veiculo(self):
        self.client.post(self.url, self.dados_novo_veiculo, format="json")
        veiculo = Veiculos.objects.first()
        url_detalhe = f'{self.url}{veiculo.id}/' 
        
        resposta = self.client.get(url_detalhe)
        
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data['placa'], "QSX-1876") 

    def test_editar_veiculo(self):
        self.client.post(self.url, self.dados_novo_veiculo, format="json")
        veiculo = Veiculos.objects.first()
        url_detalhe = f'{self.url}{veiculo.id}/'
        
        dados_atualizados = self.dados_novo_veiculo.copy()
        dados_atualizados['cor'] = "Preto"
        
        resposta = self.client.put(url_detalhe, dados_atualizados, format="json")
        
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        
        veiculo.refresh_from_db()
        self.assertEqual(veiculo.cor, "Preto")

    def test_deletar_veiculo(self):
        self.client.post(self.url, self.dados_novo_veiculo, format="json")
        veiculo = Veiculos.objects.first()
        url_detalhe = f'{self.url}{veiculo.id}/'
        
        resposta = self.client.delete(url_detalhe)
        
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Veiculos.objects.count(), 0)