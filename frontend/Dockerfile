FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=https://getshelfio.com
ARG NEXT_PUBLIC_COMPANY_SITE_URL=https://shelfiolabs.com/
ARG NEXT_PUBLIC_SUPPORT_EMAIL=info@shelfiolabs.com
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_SHELFIO_APP_URL=https://shelfiolabs.com/
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_COMPANY_SITE_URL=$NEXT_PUBLIC_COMPANY_SITE_URL
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SHELFIO_APP_URL=$NEXT_PUBLIC_SHELFIO_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3007
CMD ["npm", "run", "start"]
