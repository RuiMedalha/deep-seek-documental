# Deep Seek Documental - SaaS de Gestão Documental e Conciliação

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sistema SaaS multi-tenant completo para gestão documental, importação bancária, conciliação financeira e integrações com serviços portugueses.

## ✨ Funcionalidades

### 📄 Gestão Documental
- Upload de documentos (PDF, JPG, PNG, DOCX)
- OCR e extração de dados
- Detecção de duplicados
- Regras de pastas automáticas
- Tratamento de documentos internacionais

### 💰 Financeiro
- Importação CSV bancário
- Conciliação automática
- Calendário de pagamentos
- Relatórios financeiros
- Exportação Excel

### 🇵🇹 Integrações Portuguesas
- TOConline
- Ifthenpay
- Moloni
- WooCommerce

### 👥 CRM Próprio
- Gestão de contactos
- Pipeline de vendas
- Atividades
- Integração documental

## 🚀 Instalação

```bash
# Clone
git clone https://github.com/RuiMedalha/deep-seek-documental.git
cd deep-seek-documental

# Configure
cp .env.example .env

# Inicie serviços
docker-compose up -d

# Instale dependências
npm install

# Execute
npm run dev
