# ⚙️ Backend - O Seu Síndico

API RESTful completa em Python e Django REST Framework para o sistema de gestão condominial **O Seu Síndico**.

---

## 🛠️ Tecnologias
- **Linguagem:** Python 3.14
- **Framework:** Django 6.1.1 & Django REST Framework 3.18.1
- **Autenticação:** JWT Bearer (djangorestframework-simplejwt 5.5.1)
- **Documentação:** drf-spectacular (OpenAPI 3 / Swagger UI)
- **Banco de Dados:** PostgreSQL (psycopg2-binary)
- **Gerenciador de Dependências:** Poetry

---

## 📁 Módulos e Apps
- `accounts/`: Gestão de usuários, perfis de Moradores, Porteiros e Síndicos, e endpoint `/api/moradores/me/`.
- `veiculos/`: Controle de veículos, placas e identificação para vagas/portaria.
- `encomendas/`: Registro de pacotes recebidos na portaria e controle de entrega/retirada.
- `areas/`: Cadastro de áreas comuns (churrasqueira, salão de festas) e prevenção de colisão de reservas.
- `lavanderia/`: Catálogo de máquinas de lavar e agendamento de horários pelos moradores.
- `config/`: Configurações centrais do Django, middleware de logs, CORS e roteamento.

---

## 🚀 Execução Local

```bash
# 1. Instalar dependências
poetry install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Aplicar migrações
poetry run python src/manage.py migrate

# 4. Iniciar servidor de desenvolvimento
poetry run python src/manage.py runserver 0.0.0.0:8000
```

---

## 🧪 Testes Automatizados
```bash
poetry run python src/manage.py test accounts veiculos encomendas areas lavanderia
```

Para o guia completo do projeto e orquestração local com Kubernetes e Tilt, consulte o [README.md principal](../README.md).
