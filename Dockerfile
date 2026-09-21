# Usa uma imagem oficial, leve e segura do Python
FROM python:3.14-slim

# Impede o Python de gravar arquivos .pyc no disco e força o log direto no terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define a pasta de trabalho dentro do contêiner
WORKDIR /app

# Instala ferramentas do sistema e o gerenciador Poetry
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc \
    && pip install --no-cache-dir poetry \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas os arquivos de dependência primeiro (para usar o cache do Docker)
COPY pyproject.toml poetry.lock* /app/

# Instala as dependências diretamente no sistema do contêiner (sem virtualenv)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copia o restante do código fonte do projeto (pasta src)
COPY src /app/src

# Move o contexto para onde está o manage.py
WORKDIR /app/src

# Expõe a porta que o Gunicorn vai utilizar
EXPOSE 8000

# Comando para iniciar o servidor em produção (Assumindo que sua pasta principal se chama config)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
