#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/my_strategee"

echo "========================================"
echo "  My Strategee - Deploy Script"
echo "========================================"

# --- Verificar herramientas necesarias ---
echo ""
echo "==> Verificando herramientas..."

if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js no está instalado o no está en el PATH."
  exit 1
fi
echo "  Node: $(node -v)"

if ! command -v pnpm &> /dev/null; then
  echo "  pnpm no encontrado, instalando..."
  npm install -g pnpm
fi
echo "  pnpm: $(pnpm -v)"

if ! command -v pm2 &> /dev/null; then
  echo "  pm2 no encontrado, instalando..."
  npm install -g pm2
fi
echo "  pm2: $(pm2 -v)"

# --- Permisos ---
echo ""
echo "==> Ajustando permisos en $PROJECT_DIR..."
chown -R $(whoami):$(whoami) "$PROJECT_DIR" 2>/dev/null || true

# --- Instalar dependencias ---
echo ""
echo "==> Instalando dependencias del frontend (app)..."
cd "$PROJECT_DIR/app"
npm install --legacy-peer-deps

echo ""
echo "==> Instalando dependencias del backend (api)..."
cd "$PROJECT_DIR/api"
rm -f tsconfig.build.tsbuildinfo
pnpm install

# --- Build ---
echo ""
echo "==> Compilando frontend (Angular)..."
cd "$PROJECT_DIR/app"
npm run build

echo ""
echo "==> Compilando backend (NestJS)..."
cd "$PROJECT_DIR/api"
pnpm run build

# --- Iniciar / Reiniciar con PM2 ---
echo ""
echo "==> Iniciando servidor con PM2..."
cd "$PROJECT_DIR"

# Si ya existe el proceso, lo reinicia; si no, lo crea
if pm2 describe my-strategee > /dev/null 2>&1; then
  echo "  Proceso existente encontrado, reiniciando..."
  pm2 restart my-strategee
else
  echo "  Creando nuevo proceso PM2..."
  pm2 start npm --name "my-strategee" -- run start:prod
fi

# Guardar la lista de procesos para que sobreviva reinicios del servidor
pm2 save

echo ""
echo "========================================"
echo "  Deploy completado exitosamente!"
echo "  La app está corriendo en el puerto definido en .env (PORT)"
echo "========================================"
