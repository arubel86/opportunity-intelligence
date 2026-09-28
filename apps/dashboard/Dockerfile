# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json turbo.json ./
COPY apps/dashboard/package*.json ./apps/dashboard/

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente del proyecto
COPY . .

# Variables de entorno inyectadas durante la construcción (Coolify Build Arguments)
ARG VITE_INSFORGE_URL=https://insforge.aizprua.com
ARG VITE_INSFORGE_API_KEY=""
ARG INSFORGE_URL=https://insforge.aizprua.com
ARG INSFORGE_API_KEY=""

ENV VITE_INSFORGE_URL=$VITE_INSFORGE_URL
ENV VITE_INSFORGE_API_KEY=$VITE_INSFORGE_API_KEY
ENV INSFORGE_URL=$INSFORGE_URL
ENV INSFORGE_API_KEY=$INSFORGE_API_KEY

# Compilar todas las páginas (index, login, landing-1, landing-2)
RUN npm run build --prefix apps/dashboard

# ── Stage 2: Serve with Nginx ──
FROM nginx:alpine

# Copiar configuración con rutas limpias (/login, /dashboard, /landing-1, /landing-2)
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
