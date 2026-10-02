# Infraestrutura Local & Kubernetes (Tilt) - O Seu Síndico

Este diretório contém os manifests do Kubernetes e as configurações de contêineres para desenvolvimento local orquestrado via **Tilt**.

---

## 🏗️ Estrutura de Arquivos

```text
infra/
├── docker/
│   ├── backend.Dockerfile     # Dockerfile do Django com suporte a hot-reload e Poetry
│   └── frontend.Dockerfile    # Dockerfile do Next.js com suporte a fast-refresh
├── k8s/
│   ├── postgres.yaml          # Secret, PVC, Deployment e Service do PostgreSQL (porta 5432)
│   ├── backend.yaml           # ConfigMap, Secret, Deployment e Service da API Django (porta 8000)
│   └── frontend.yaml          # ConfigMap, Deployment e Service do Next.js (porta 3000)
└── README.md                  # Este guia
```

---

## 🚀 Como Iniciar com Tilt

### Pré-requisitos
1. **Docker Desktop** ativo com o **Kubernetes habilitado** (Settings > Kubernetes > Enable Kubernetes).
2. **Tilt CLI** instalado (`tilt version`).
3. **kubectl** instalado e apontando para o contexto local (`kubectl config use-context docker-desktop`).

### Comandos de Inicialização

Na raiz do repositório (`OSeuSindico/`), execute:

```bash
tilt up
```

Pressione a barra de espaço para abrir o **Dashboard do Tilt** no navegador (`http://localhost:10350`).

### Portas e Recursos Expostos Localmente:
- 🌐 **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API (Django):** [http://localhost:8000](http://localhost:8000)
- 📑 **Swagger UI:** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- 🗄️ **PostgreSQL:** `localhost:5432` (`user: postgres`, `password: postgres`, `db: postgres`)

---

## ⚡ Live Update & Hot Reload
O `Tiltfile` está configurado com `live_update`:
- **Backend:** Alterações em `backend/src/` são sincronizadas em milissegundos para o container sem recriar o pod. O Django recarrega automaticamente.
- **Frontend:** Alterações em `frontend/app/`, `components/`, `lib/`, etc., são refletidas instantaneamente via Next.js Fast Refresh.
- **Novas dependências:** Ao modificar `package.json`, o Tilt executa automaticamente `npm install` dentro do pod.
