# Dockerfile para apps/experience-3d
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar dependencias
COPY package.json ./
RUN npm install --production

# Copiar código fuente
COPY . .

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

# Volumen persistente para datos y uploads
VOLUME ["/app/data"]

CMD ["node", "server.js"]
