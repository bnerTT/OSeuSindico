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
        
        self.user2 = User.objects.create_user(username='morador2', password='123')
        self.morador2 = Morador.objects.create(
            user=self.user2,
            cpf="98765432100",
            data_nascimento="1990-05-20",
            apartamento="A101"
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
        dados = response.json()
        
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['nome'], "Churrasqueira")

    def test_criar_reserva_com_sucesso(self):
        """Garante que é possível criar uma reserva passando os IDs corretos"""
        url = reverse('reservas-list') # (/reservas/)
        agora = timezone.now() + timedelta(days=1)
        
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

    def test_bloquear_reserva_data_passada(self):
        """Impede criação de reservas para datas ou horários que já passaram"""
        url = reverse('reservas-list')
        ontem = timezone.now() - timedelta(days=1)
        
        payload = {
            "data_inicio": ontem,
            "data_fim": ontem + timedelta(hours=3),
            "morador": self.morador.id,
            "area": self.area.id,
            "status": "pendente"
        }
        
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_inicio', response.data)

    def test_bloquear_reserva_conflitante_mesmo_horario(self):
        """Impede que dois moradores reservem a mesma área no mesmo horário ou em horários sobrepostos"""
        url = reverse('reservas-list')
        inicio = timezone.now() + timedelta(days=2, hours=14)
        fim = inicio + timedelta(hours=4) # 14h às 18h
        
        # 1. Primeira reserva criada com sucesso pelo morador 1
        ReservaArea.objects.create(
            area=self.area,
            morador=self.morador,
            data_inicio=inicio,
            data_fim=fim,
            status='confirmada'
        )
        
        # 2. Morador 2 tenta reservar no meio do período (15h às 17h)
        payload_conflito = {
            "data_inicio": inicio + timedelta(hours=1),
            "data_fim": inicio + timedelta(hours=3),
            "morador": self.morador2.id,
            "area": self.area.id,
            "status": "pendente"
        }
        
        response = self.client.post(url, data=payload_conflito, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflito', response.data)

    def test_permitir_reserva_horarios_diferentes_mesmo_dia(self):
        """Permite reservas para a mesma área em horários distintos sem sobreposição"""
        url = reverse('reservas-list')
        inicio1 = timezone.now() + timedelta(days=3, hours=10)
        fim1 = inicio1 + timedelta(hours=4) # 10h às 14h
        
        ReservaArea.objects.create(
            area=self.area,
            morador=self.morador,
            data_inicio=inicio1,
            data_fim=fim1,
            status='confirmada'
        )
        
        # Morador 2 reserva a partir das 14h (sem choque)
        payload_sem_conflito = {
            "data_inicio": fim1,
            "data_fim": fim1 + timedelta(hours=4), # 14h às 18h
            "morador": self.morador2.id,
            "area": self.area.id,
            "status": "pendente"
        }
        
        response = self.client.post(url, data=payload_sem_conflito, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReservaArea.objects.count(), 2)

    def test_acesso_negado_sem_autenticacao(self):
        """Garante que usuários deslogados tomam erro 401"""
        self.client.force_authenticate(user=None) # Desloga explicitamente
        url = reverse('areas-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)