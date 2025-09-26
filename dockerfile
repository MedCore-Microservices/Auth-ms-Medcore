# Usa una imagen de Node.js
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala todas las dependencias (incluyendo devDependencies, necesarias para compilar TS)
RUN npm ci

# Copia todo el código fuente
COPY . .
RUN npx prisma generate

# Compila TypeScript → genera la carpeta dist/
RUN npm run build

# Ejecuta la app compilada
CMD ["node", "dist/app.js"]