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
