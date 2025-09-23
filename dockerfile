# Etapa 1: Construcción con Node.js Alpine
FROM node:20.14.0-alpine AS builder

WORKDIR /app

# Actualizar paquetes del sistema (solo en build)
RUN apk update && apk upgrade --no-cache

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Generar cliente Prisma (requiere schema.prisma)
RUN npx prisma generate

# Compilar TypeScript a JavaScript
RUN npm run build


# Etapa 2: Producción con Distroless (Google) — mínima superficie de ataque
FROM gcr.io/distroless/nodejs20-debian12 AS production

WORKDIR /app

# Copiar solo lo necesario para ejecutar la app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Puerto de la app 
EXPOSE 3000

# Comando para iniciar la app

CMD ["dist/app.js"]