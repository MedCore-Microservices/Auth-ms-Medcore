#!/bin/sh
set -e

# Si tienes DATABASE_URL, intenta migraciones
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected, running migrations (if any)..."
  npx prisma migrate deploy || echo "prisma migrate deploy failed (continuing)"
fi

# Ejecutar start script (usa package.json.start para ser consistente)
exec npm run start
