# -*- mode: Python -*-
# Tiltfile: Orquestração Local para Kubernetes - O Seu Síndico

# 1. Carrega os manifestos Kubernetes de cada serviço
k8s_yaml([
    'infra/k8s/postgres.yaml',
    'infra/k8s/backend.yaml',
    'infra/k8s/frontend.yaml',
])

# 2. Build e Live Update do Backend (Django REST Framework)
docker_build(
    'oseusindico-backend',
    './backend',
    dockerfile='infra/docker/backend.Dockerfile',
    live_update=[
        # Sincroniza o código Python em tempo real direto para o container (hot-reload nativo)
        sync('./backend/src', '/app/src'),
    ],
    ignore=[
        '**/__pycache__',
        '**/*.pyc',
        '**/.pytest_cache',
        '**/db.sqlite3',
        '**/.venv',
    ],
)

# 3. Build e Live Update do Frontend (Next.js)
docker_build(
    'oseusindico-frontend',
    './frontend',
    dockerfile='infra/docker/frontend.Dockerfile',
    live_update=[
        # Sincroniza código, páginas, estilos e componentes para o container
        sync('./frontend/app', '/app/app'),
        sync('./frontend/components', '/app/components'),
        sync('./frontend/contexts', '/app/contexts'),
        sync('./frontend/hooks', '/app/hooks'),
        sync('./frontend/lib', '/app/lib'),
        sync('./frontend/public', '/app/public'),
        sync('./frontend/next.config.mjs', '/app/next.config.mjs'),
        sync('./frontend/package.json', '/app/package.json'),
        # Caso dependências sejam adicionadas/alteradas, dispara npm install no container
        run('npm install', trigger=['./frontend/package.json', './frontend/package-lock.json']),
    ],
    ignore=[
        '**/node_modules',
        '**/.next',
        '**/*.tsbuildinfo',
        '**/.git',
    ],
)

# 4. Agrupamento de Recursos, Port-Forwards e Dependências no Dashboard do Tilt
k8s_resource(
    'postgres',
    port_forwards=['5432:5432'],
    labels=['database']
)

k8s_resource(
    'backend',
    port_forwards=['8000:8000'],
    resource_deps=['postgres'],
    labels=['api']
)

k8s_resource(
    'frontend',
    port_forwards=['3000:3000'],
    resource_deps=['backend'],
    labels=['web']
)
