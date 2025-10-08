# Dockerfile
# ---------- STAGE: builder ----------
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Copiamos package-lock y package.json para instalar
COPY package*.json ./

# Instala dependencias (dev+prod) para poder build + generar prisma client
RUN npm ci

# Copiamos el resto
COPY . .

# Generar cliente Prisma y compilar (ajusta si no usas TS)
RUN npx prisma generate || true
RUN npm run build

# ---------- STAGE: runner ----------
FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiamos solo lo necesario desde builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Asegurar permisos de ejecución
RUN chmod +x ./entrypoint.sh

# Puerto recomendado (Render pondrá PORT env var)
EXPOSE 3001

# Arranque
CMD ["./entrypoint.sh"]
