# Deploy no Coolify

Guia de deploy do **Deep Seek Documental** no Coolify (2 aplicações + 2 serviços).

## Arquitetura no Coolify

| Recurso | Tipo | Porta | Domínio sugerido |
|---|---|---|---|
| PostgreSQL 16 | Database (Coolify) | 5432 (interno) | — |
| Redis 7 | Database (Coolify) | 6379 (interno) | — |
| API (NestJS) | Application (Dockerfile) | 4000 | `api.o-teu-dominio.com` |
| Web (Next.js) | Application (Dockerfile) | 3000 | `app.o-teu-dominio.com` |

> Em alternativa, podes usar o `docker-compose.prod.yml` como recurso "Docker Compose" no Coolify — ele já inclui os 4 serviços, healthchecks e volumes.

## 1. Criar os serviços de dados

1. **PostgreSQL 16** — cria uma base `saas_docs` e guarda a connection string interna, ex.:
   `postgresql://saas_docs:<password>@<host-interno>:5432/saas_docs?schema=public`
2. **Redis 7** — guarda o host/porta internos.

## 2. Aplicação API

- **Build Pack:** Dockerfile
- **Base Directory:** `apps/api`
- **Dockerfile:** `apps/api/Dockerfile`
- **Porta exposta:** `4000`
- **Health check:** `GET /api/health`

### Variáveis de ambiente (runtime)

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://saas_docs:<password>@<postgres-interno>:5432/saas_docs?schema=public
REDIS_HOST=<redis-interno>
REDIS_PORT=6379
JWT_ACCESS_SECRET=<gera com: openssl rand -hex 32>
JWT_REFRESH_SECRET=<gera com: openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://app.o-teu-dominio.com
```

### Volume persistente (uploads)

Os documentos são guardados em disco local. Adiciona um **Persistent Storage** no Coolify:

- **Destination Path:** `/app/uploads`

Sem este volume, os uploads perdem-se em cada redeploy.

### Migrações

O container executa `prisma migrate deploy` automaticamente no arranque.
Para popular dados iniciais (seed), executa uma vez no terminal do container:

```bash
npx prisma db seed
```

## 3. Aplicação Web

- **Build Pack:** Dockerfile
- **Base Directory:** `apps/web`
- **Dockerfile:** `apps/web/Dockerfile`
- **Porta exposta:** `3000`

### Variáveis de ambiente

`NEXT_PUBLIC_API_URL` é embebida no **build** (Next.js), por isso tem de ser
definida como **Build Variable** (build arg) no Coolify:

```env
NEXT_PUBLIC_API_URL=https://api.o-teu-dominio.com
NEXT_PUBLIC_APP_NAME=SaaS Docs
```

> ⚠️ Se mudares `NEXT_PUBLIC_API_URL`, é preciso **rebuild** (não basta restart).

## 4. Domínios e HTTPS

1. Aponta os DNS `api.` e `app.` para o servidor do Coolify.
2. Define os FQDN em cada aplicação; o Coolify trata do certificado (Let's Encrypt).
3. Confirma que `FRONTEND_URL` (API) e `NEXT_PUBLIC_API_URL` (Web) usam os domínios finais com `https://`.

## 5. Checklist final

- [ ] `DATABASE_URL` aponta para o Postgres interno do Coolify
- [ ] `REDIS_HOST`/`REDIS_PORT` apontam para o Redis interno
- [ ] Segredos JWT gerados aleatoriamente (nunca os defaults)
- [ ] Volume persistente em `/app/uploads`
- [ ] `NEXT_PUBLIC_API_URL` definida como build arg no Web
- [ ] `FRONTEND_URL` definida na API (CORS restrito ao frontend)
- [ ] Health check da API em `/api/health` a devolver `{"status":"ok"}`
- [ ] Seed executado (utilizador inicial)

## Notas

- **MinIO/S3:** o `docker-compose.yml` de dev inclui MinIO, mas o código atual guarda ficheiros em disco (`uploads/`) — não é preciso MinIO em produção por agora.
- **Email/SMTP:** o módulo de notificações usa nodemailer; configura as variáveis SMTP se quiseres envio de emails.
- **Swagger:** disponível em `https://api.o-teu-dominio.com/api-docs`.
