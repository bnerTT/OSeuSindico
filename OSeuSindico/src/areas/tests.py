from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from .models import Areas, ReservaArea
from accounts.models import Morador

class AreasEReservasTests(APITestCase):
    def setUp(self):
        # 1. Cria o usuário e o morador com os campos exatos do seu modelo
        self.user = User.objects.create_user(username='sindico', password='123')
        
        self.morador = Morador.objects.create(
            user=self.user,
            cpf="12345678900",
            data_nascimento="1992-08-15",
            apartamento="C302"
        )
        
        # 2. Cria uma área no banco de dados para os testes
        self.area = Areas.objects.create(
            nome="Churrasqueira", 
            descricao="Área com grelha e freezer"
        )

        # 3. Autentica o cliente (simula o token JWT)
        self.client.force_authenticate(user=self.user)

    def test_listar_areas(self):
        """Garante que a API retorna as áreas criadas"""
        url = reverse('areas-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Como não há paginação, a resposta já é a própria lista
        dados = response.json()
        
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['nome'], "Churrasqueira")

    def test_criar_reserva_com_sucesso(self):
        """Garante que é possível criar uma reserva passando os IDs corretos"""
        url = reverse('reservas-list') # (/reservas/)
        agora = timezone.now()
        
        payload = {
            "data_inicio": agora,
            "data_fim": agora + timedelta(hours=4),
            "morador": self.morador.id,
            "area": self.area.id,
            "status": "pendente"
        }
        
        response = self.client.post(url, data=payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReservaArea.objects.count(), 1)
        
        # Verifica se o aninhamento do serializer funcionou
        self.assertEqual(response.data['area_detalhes']['nome'], "Churrasqueira")

    def test_acesso_negado_sem_autenticacao(self):
        """Garante que usuários deslogados tomam erro 401"""
        self.client.force_authenticate(user=None) # Desloga explicitamente
        url = reverse('areas-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)