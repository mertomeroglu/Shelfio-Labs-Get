# GetShelfio Service Site and Portal

GetShelfio is the public service-site and customer-portal monorepo for Shelfio. It includes the marketing pages for package discovery and demo requests, plus the backend surfaces used for account access, license activation, support, admin workflows, and integration with the main Shelfio platform.

## Overview

This repository is prepared as a public portfolio version of the GetShelfio web/service layer. It keeps real application structure and local development workflows while avoiding production credentials, private deployment details, and unsupported product claims.

## Current Project Status

This is a public portfolio version of the GetShelfio monorepo. The codebase contains working frontend and backend modules, but production deployment still requires environment-specific secret management, database operations, monitoring, backups, and security review.

## Implemented Features

- Marketing pages, package/pricing presentation, contact/support entry points.
- Demo request form with backend validation, honeypot handling, and rate limiting.
- Customer registration, login/logout, password reset, signed HttpOnly session cookies.
- Customer portal pages for account overview, licenses, billing summary, invoices, settings, support tickets, store-license requests, and data export requests.
- License validation, activation, claiming, cancellation, renewal/admin creation, and plan-change request flows.
- Admin dashboard surfaces for customers, demo requests, licenses, support tickets, store-license requests, and data export requests.
- Support ticket creation and replies, including public reply links for emailed responses.
- Prototype checkout flow using internal test payment records and masked card display.
- SSO/control API integration surface using short-lived one-time panel access codes.
- PostgreSQL migrations and seed scripts for local development.

## Planned Features

- Production payment provider integration. Current checkout is a prototype/test flow.
- Production-grade billing automation, taxes, invoice delivery, and payment reconciliation.
- Full production SSO deployment with the main Shelfio app and agreed redirect/callback contracts.
- Direct store provisioning inside GetShelfio. The current API intentionally rejects local store creation and uses store-license request workflows.
- Final repository screenshots using real, sanitized application images.
- Operational hardening such as observability, backup/restore playbooks, CI, and deployment runbooks.

## Architecture

- `frontend/`: Next.js application for public pages, customer portal, admin UI, and API proxy routes.
- `backend/`: TypeScript Node.js HTTP API backed by PostgreSQL.
- `backend/src/db/migrations/`: ordered SQL migrations managed by the local migration runner.
- `scripts/cleanup/`: maintenance scripts for local or controlled cleanup tasks.
- `docker-compose.yml`: local development stack with the frontend, backend, and a local PostgreSQL container.

The frontend uses public `NEXT_PUBLIC_*` values only. Server-only secrets stay in the backend environment.

## Technology Stack

- Node.js 22+
- Next.js 16, React 19, TypeScript
- Node.js HTTP API with TypeScript
- PostgreSQL
- Docker Compose for local development
- Nodemailer for optional transactional email

## Repository Structure

```text
.
├── backend/              # TypeScript API, migrations, seed scripts
├── frontend/             # Next.js public site, customer portal, admin UI
├── scripts/cleanup/      # Maintenance cleanup scripts
├── docs/screenshots/     # Real sanitized screenshots should be placed here
├── docker-compose.yml    # Safe local development stack
├── package.json          # Root orchestration scripts
├── SECURITY.md
├── CONTRIBUTING.md
└── LICENSE
```

## Local Installation

```bash
nvm use
npm install
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update `backend/.env` with local-only secrets before running the backend. Do not use production credentials for local development.

## Environment Variables

- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

Backend-only secrets include `DATABASE_URL`, `SESSION_SECRET`, `LICENSE_KEY_PEPPER`, `LICENSE_KEY_ENCRYPTION_SECRET`, `CONTROL_API_INTERNAL_SECRET`, `SUPPORT_TOKEN_SECRET`, SMTP credentials, and optional Shelfio-Labs integration secrets.

Frontend variables must stay public and limited to values such as `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_COMPANY_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, and `NEXT_PUBLIC_SHELFIO_APP_URL`.

## Development Commands

```bash
npm run dev              # Run frontend and backend together
npm run dev:frontend     # Run only the Next.js frontend on port 3007
npm run dev:backend      # Run only the API on port 4017
npm run lint             # Type/lint checks for both apps
npm run typecheck        # Type checks for both apps
npm run build            # Production builds for frontend and backend
```

## Database and Prisma Setup

This repository does not use Prisma. Database schema changes are managed with SQL files in `backend/src/db/migrations/` and the custom migration runner.

```bash
npm run db:migrate --prefix backend
npm run db:seed --prefix backend
```

Seed values are controlled by `backend/.env`. Use development-only accounts and license keys.

## Production Build

```bash
npm run build
npm run start --prefix backend
npm run start --prefix frontend
```

Production runtime requires real secrets supplied by the deployment platform, HTTPS, secure cookie settings, a managed PostgreSQL database, and a reviewed CORS origin list.

## Docker Setup

For local development:

```bash
docker compose up --build
```

The compose file includes safe local PostgreSQL credentials and development-only placeholder secrets. It is not a production deployment file.

## Authentication and SSO Notes

- Sessions are signed and stored in HttpOnly cookies.
- Production requires explicit, non-placeholder session, license, encryption, control API, and support-token secrets.
- Cookies default to secure production behavior and relaxed local behavior.
- Backend routes enforce license, role, and tenant checks; frontend guards are only UX helpers.
- SSO uses short-lived one-time codes stored as hashes. The main Shelfio application must exchange the code with the control API.
- Password reset, support reply, and data-export download links use opaque limited-scope tokens; they should be treated as sensitive and kept out of logs.

## Security Considerations

- Do not commit `.env` files, logs, dumps, uploads, build output, deployment secrets, private paths, or real customer data.
- Do not put server-only secrets in frontend env files.
- Demo and support submissions have backend validation and rate limiting.
- Error responses avoid stack traces and raw secret values.
- Public repository visibility does not mean the software is open source or production-ready.
- See `SECURITY.md` before reporting a vulnerability.

## Related Repositories

- https://github.com/mertomeroglu/Shelfio-Labs
- https://github.com/mertomeroglu/Shelfio-Mobile-Apps
- https://github.com/mertomeroglu/shelfio-esl-ble-firmware

## Screenshots

Real screenshots have not been added yet. Place sanitized images in `docs/screenshots/` before publishing a repository profile preview:

- `docs/screenshots/home.png`
- `docs/screenshots/demo-request.png`
- `docs/screenshots/customer-portal.png`
- `docs/screenshots/admin-dashboard.png`

Do not use fake screenshots or images containing real customer data, credentials, private URLs, or license keys.

## Known Limitations

- Checkout and billing are prototype/test flows, not a real payment processor integration.
- Direct local store creation is intentionally disabled in GetShelfio.
- Data export and SSO depend on compatible Shelfio-Labs integration endpoints and shared control secrets.
- No CI workflow is included in this public-ready cleanup.
- Production deployment details are intentionally not included.

## License

Copyright 2026 Mert Ömeroğlu. All rights reserved.

This repository is available for portfolio review and source-code inspection only. Public visibility does not grant open source rights; see `LICENSE` for usage restrictions.

## Türkçe Kısa Not

Bu repo, GetShelfio tanıtım sitesi ve müşteri/lisans portalı için public portfolyo görünümüne hazırlanmış monorepodur. Gerçek production secret, private endpoint ve müşteri verisi içermez; canlı kullanım için ayrıca güvenli ortam yapılandırması gerekir.
