# AGENTS.md - Memória Compartilhada

## Projeto
- **Nome:** O Seu Síndico
- **Domínio:** Gestão Condominial (Portaria, Moradores, Veículos e Encomendas)

## Stack Técnica
- **Backend (este repositório):** Python 3.14 | Django 6.1.1 | Django REST Framework 3.18.1 | SimpleJWT 5.5.1 | drf-spectacular | PostgreSQL | Docker
- **Frontend (repositório/pasta separada):** Next.js

## Padrões Arquiteturais
- **Backend:** Modular Django Apps (`accounts`, `veiculos`, `encomendas`, `config`).
- **Autenticação:** JWT Bearer via SimpleJWT (`/api/token/`, `/api/token/refresh/`).
- **Separação de Repositórios:** Frontend será mantido isolado em outro repositório/pasta, consumindo este backend via REST/JSON.

## Estado Atual
- [x] Documentação completa para RAG e geração de front-end criada em `API_DOCUMENTATION_RAG.md`.
- [x] Endpoints testados e validados (Moradores, Veículos, Encomendas, Autenticação).
- [ ] Criação do repositório/projeto frontend em Next.js (em pasta separada).

## Registro de Agentes
- **2026-09-29 [Gemini]:** Inicialização do AGENTS.md, ativação da memória de sessão e geração da documentação técnica `API_DOCUMENTATION_RAG.md`.
