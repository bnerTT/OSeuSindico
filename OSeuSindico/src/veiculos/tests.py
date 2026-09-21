from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import Morador
from .models import Veiculos

class VeiculosAPITests(APITestCase):
    def setUp(self):
        self.url = '/veiculos/'
        
        # 1. Cria um usuário Staff (Porteiro/Síndico) e força o login
        self.usuario_staff = User.objects.create_user(username="admin_veiculos", password="123", is_staff=True)
        self.client.force_authenticate(user=self.usuario_staff)
        
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
        self.client.post(self.url, self.dados_novo_veiculo, format="json")
        resposta = self.client.get(self.url)
        
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        
        # MUDANÇA AQUI: Agora contamos quantos itens tem dentro de 'results'
        quantidade_veiculos = len(resposta.json()['results'])
        self.assertEqual(quantidade_veiculos, 1)
        
    
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
        
    def test_filtros_veiculos(self):

        self.client.post(self.url, self.dados_novo_veiculo, format="json")
        
       
        morador_b = Morador.objects.create(
            user=User.objects.create_user(username="outro_dono", password="123"),
            cpf="11122233344",
            data_nascimento="1985-01-01",
            apartamento="204A"
        )
        dados_veiculo_b = {
            "morador": morador_b.id,
            "placa": "ABC-1234",
            "modelo": "Civic",
            "cor": "Preto",
        }
        self.client.post(self.url, dados_veiculo_b, format="json")
        
        # Confirma que há 2 veículos no banco
        self.assertEqual(Veiculos.objects.count(), 2)

        
        resposta_placa = self.client.get(f'{self.url}?placa=QSX-1876')
        resultados_placa = resposta_placa.json()['results']
        self.assertEqual(len(resultados_placa), 1)
        self.assertEqual(resultados_placa[0]['placa'], 'QSX-1876')

        
        resposta_apt = self.client.get(f'{self.url}?apartamento=204A')
        resultados_apt = resposta_apt.json()['results']
        self.assertEqual(len(resultados_apt), 1)
        self.assertEqual(resultados_apt[0]['placa'], 'ABC-1234') # O carro do apt 204A é o Civic (ABC-1234)

        resposta_morador = self.client.get(f'{self.url}?morador={self.morador_dono.id}')
        resultados_morador = resposta_morador.json()['results']
        self.assertEqual(len(resultados_morador), 1)
        self.assertEqual(resultados_morador[0]['placa'], 'QSX-1876')