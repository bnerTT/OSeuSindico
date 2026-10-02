from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from .models import Maquina, ReservaMaquina
from accounts.models import Morador

class LavanderiaEReservasTests(APITestCase):
    def setUp(self):
        # 1. Usuário morador comum
        self.user_morador = User.objects.create_user(username='morador_test', password='123')
        self.morador = Morador.objects.create(
            user=self.user_morador,
            cpf="11122233344",
            data_nascimento="1995-03-10",
            apartamento="B204"
        )

        # 2. Outro morador comum
        self.user_morador2 = User.objects.create_user(username='morador2_test', password='123')
        self.morador2 = Morador.objects.create(
            user=self.user_morador2,
            cpf="55566677788",
            data_nascimento="1990-07-22",
            apartamento="C101"
        )

        # 3. Usuário Administrador (staff)
        self.user_admin = User.objects.create_user(username='sindico_admin', password='123', is_staff=True)

        # 4. Criação de máquina inicial
        self.maquina1 = Maquina.objects.create(
            numero=1,
            capacidade=10.5,
            preco=15.0
        )
        self.maquina2 = Maquina.objects.create(
            numero=2,
            capacidade=12.0,
            preco=18.0
        )

        # Autentica por padrão como morador
        self.client.force_authenticate(user=self.user_morador)

    def test_listar_maquinas(self):
        """Morador pode consultar máquinas cadastradas"""
        url = reverse('maquinas-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dados = response.json()
        self.assertEqual(len(dados), 2)

    def test_morador_nao_pode_cadastrar_maquina(self):
        """Morador comum NÃO pode cadastrar máquinas (403 Forbidden)"""
        url = reverse('maquinas-list')
        payload = {
            "numero": 3,
            "capacidade": 8.0,
            "preco": 12.0
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_pode_cadastrar_maquina(self):
        """Administrador pode cadastrar novas máquinas (201 Created)"""
        self.client.force_authenticate(user=self.user_admin)
        url = reverse('maquinas-list')
        payload = {
            "numero": 3,
            "capacidade": 8.0,
            "preco": 12.0
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['numero'], 3)

    def test_criar_reserva_maquina_com_sucesso(self):
        """Morador pode reservar máquina para horário futuro"""
        url = reverse('maquinas-reservas-list')
        inicio = timezone.now() + timedelta(days=1, hours=10)
        fim = inicio + timedelta(hours=2)

        payload = {
            "maquina": self.maquina1.id,
            "morador": self.morador.id,
            "horario_inicio": inicio.isoformat(),
            "horario_final": fim.isoformat()
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dados = response.json()
        self.assertEqual(dados['maquina'], self.maquina1.id)
        self.assertEqual(dados['morador_nome'], 'morador_test')

    def test_bloquear_reserva_maquina_data_passada(self):
        """Impede reserva de máquina para horários que já passaram"""
        url = reverse('maquinas-reservas-list')
        passado = timezone.now() - timedelta(days=1)

        payload = {
            "maquina": self.maquina1.id,
            "morador": self.morador.id,
            "horario_inicio": passado.isoformat(),
            "horario_final": (passado + timedelta(hours=2)).isoformat()
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("horario_inicio", response.json())

    def test_bloquear_conflito_mesmo_horario_mesma_maquina(self):
        """Impede que dois moradores reservem a mesma máquina no mesmo horário"""
        inicio = timezone.now() + timedelta(days=2, hours=14)
        fim = inicio + timedelta(hours=2)

        # 1. Primeira reserva criada com sucesso
        ReservaMaquina.objects.create(
            maquina=self.maquina1,
            morador=self.morador,
            horario_inicio=inicio,
            horario_final=fim
        )

        # 2. Segundo morador tenta reservar a mesma máquina com sobreposição
        self.client.force_authenticate(user=self.user_morador2)
        url = reverse('maquinas-reservas-list')
        payload_conflito = {
            "maquina": self.maquina1.id,
            "morador": self.morador2.id,
            "horario_inicio": (inicio + timedelta(minutes=30)).isoformat(),
            "horario_final": (fim + timedelta(minutes=30)).isoformat()
        }
        response = self.client.post(url, payload_conflito)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.json())

    def test_permitir_reserva_mesma_maquina_horarios_distintos(self):
        """Permite reservas para a mesma máquina em horários que não se sobrepõem"""
        inicio1 = timezone.now() + timedelta(days=3, hours=8)
        fim1 = inicio1 + timedelta(hours=2)

        ReservaMaquina.objects.create(
            maquina=self.maquina1,
            morador=self.morador,
            horario_inicio=inicio1,
            horario_final=fim1
        )

        # Segundo morador reserva após o término da primeira
        self.client.force_authenticate(user=self.user_morador2)
        url = reverse('maquinas-reservas-list')
        payload = {
            "maquina": self.maquina1.id,
            "morador": self.morador2.id,
            "horario_inicio": fim1.isoformat(),
            "horario_final": (fim1 + timedelta(hours=2)).isoformat()
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_permitir_reserva_maquinas_diferentes_mesmo_horario(self):
        """Permite que máquinas diferentes sejam reservadas simultaneamente"""
        inicio = timezone.now() + timedelta(days=3, hours=10)
        fim = inicio + timedelta(hours=2)

        ReservaMaquina.objects.create(
            maquina=self.maquina1,
            morador=self.morador,
            horario_inicio=inicio,
            horario_final=fim
        )

        # Segundo morador reserva a máquina 2 no mesmo horário
        self.client.force_authenticate(user=self.user_morador2)
        url = reverse('maquinas-reservas-list')
        payload = {
            "maquina": self.maquina2.id,
            "morador": self.morador2.id,
            "horario_inicio": inicio.isoformat(),
            "horario_final": fim.isoformat()
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
