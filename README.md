# Deep Seek Documental - SaaS de Gestão Documental e Conciliação

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-blue)](https://www.prisma.io/)

Sistema SaaS multi-tenant completo para gestão documental, importação bancária, conciliação financeira, CRM próprio e integrações com serviços portugueses.

## ✨ Funcionalidades

### 📄 Gestão Documental
- ✅ Upload de documentos (PDF, JPG, PNG, DOCX)
- ✅ OCR e extração de dados
- ✅ Detecção de duplicados
- ✅ Regras de pastas automáticas
- ✅ Tratamento de documentos internacionais
- ✅ Multi-idioma (PT, EN, ES, FR, DE)
- ✅ Auditoria completa

### 💰 Financeiro
- ✅ Importação CSV bancário com wizard
- ✅ Conciliação automática (forte, média, fraca)
- ✅ Calendário de pagamentos
- ✅ Pagamentos recorrentes
- ✅ Relatórios financeiros
- ✅ Exportação Excel

### 👥 CRM Próprio
- ✅ Gestão de contactos (empresas e individuais)
- ✅ Pipeline de vendas
- ✅ Atividades e tarefas
- ✅ Integração documental
- ✅ Estatísticas

### 🇵🇹 Integrações Portuguesas
- ✅ TOConline (envio de faturas)
- ✅ Ifthenpay (callbacks de pagamento)
- ✅ Moloni (sincronização)
- ✅ WooCommerce

### 🔐 Segurança
- ✅ Multi-tenant com isolamento
- ✅ JWT com refresh tokens
- ✅ 2FA (Two-Factor Authentication)
- ✅ Permissões granulares por papel
- ✅ Rate limiting
- ✅ Encriptação AES-256

## 🏗️ Arquitetura
deep-seek-documental/
├── apps/
│ ├── web/ # Frontend Next.js 14
│ │ ├── app/ # App Router
│ │ │ ├── login/ # Autenticação
│ │ │ └── dashboard/ # Dashboard principal
│ │ ├── components/ # Componentes React
│ │ ├── hooks/ # Custom hooks
│ │ └── lib/ # Utilitários
│ └── api/ # Backend NestJS 10
│ ├── src/
│ │ ├── auth/ # Autenticação JWT
│ │ ├── documents/ # Gestão documental
│ │ ├── bank-import/ # Importação CSV
│ │ ├── reconciliation/ # Conciliação
│ │ ├── crm/ # CRM próprio
│ │ ├── payments/ # Calendário pagamentos
│ │ ├── integrations/ # Integrações externas
│ │ ├── reports/ # Relatórios
│ │ ├── export/ # Exportação Excel
│ │ └── notifications/ # Notificações
│ └── prisma/ # Schema e seed
├── packages/
│ └── shared/ # Código compartilhado
├── docker-compose.yml # PostgreSQL, Redis, MinIO
└── README.md

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- npm 9+

### Passos

1. **Clonar**
```bash
git clone https://github.com/RuiMedalha/deep-seek-documental.git
cd deep-seek-documental
