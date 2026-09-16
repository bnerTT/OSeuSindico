from django.test import TestCase
from .models import Morador
from rest_framework.test import APITestCase
from rest_framework import status

# Create your tests here.
class MoradorAPITests(APITestCase):
    def setUp(self):
        self.url = '/moradores/'
        self.dados_novo_morador = {
            "username": "pedro_teste",
            "password": "senha_segura_123",
            "cpf": "12345678900",
            "data_nascimento": "1992-08-15",
            "apartamento": "C302"
        }
        
    def test_criar_morador_com_sucesso(self):
        resposta = self.client.post(self.url, self.dados_novo_morador, format='json')
        
        
        print("Resposta post:", resposta.json())
        
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIn('mensagem', resposta.data)
        
    def test_listar_moradores(self):
        resposta = self.client.get(self.url)
        print("Resposta get sem post:", resposta.json())
        
        self.client.post(self.url, self.dados_novo_morador, format='json')
        
        resposta = self.client.get(self.url)
        
        
        print("Resposta get com post:", resposta.json())
                
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(resposta.json()),1)
        
    def test_deletar_morador(self):
        resposta = self.client.post(self.url, self.dados_novo_morador, format='json')
        morador = Morador.objects.first()
        url_detalhe = f'/moradores/{morador.id}/'
        
        resposta = self.client.delete(url_detalhe)
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Morador.objects.count(), 0)
        
    def test_atualizar_morador(self):
        self.client.post(self.url, self.dados_novo_morador, format='json')
        morador = Morador.objects.first()
        url_detalhe = f"/moradores/{morador.id}/"
        
        dados_atualizados = {
            "username": "pedro_teste",
            "password": "nova_senha_super_secreta",
            "cpf": "12345678900",
            "data_nascimento": "1992-08-15",
            "apartamento": "B302" 
        }
        
        resposta = self.client.put(url_detalhe, dados_atualizados, format="json")
        
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data['dados']['apartamento'], "B302")