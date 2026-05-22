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

if ! command -v npm &> /dev/null; then
  echo "[ERROR] npm no está instalado."
  exit 1
fi
echo "  npm: $(npm -v)"

if ! command -v pm2 &> /dev/null; then
  echo "  pm2 no encontrado, instalando..."
  npm install -g pm2
fi
echo "  pm2: $(pm2 -v)"

# --- Verificar .env ---
echo ""
echo "==> Verificando configuración..."
if [ ! -f "$PROJECT_DIR/api/.env" ]; then
  echo "[ERROR] No se encontró api/.env. Copia api/.env.example y configura las variables."
  exit 1
fi
echo "  .env encontrado OK"

# --- Pull últimos cambios ---
echo ""
echo "==> Actualizando código desde GitHub..."
cd "$PROJECT_DIR"
git pull origin main

# --- Instalar dependencias ---
echo ""
echo "==> Instalando dependencias..."
npm install

# --- Build ---
echo ""
echo "==> Compilando frontend (Angular)..."
npm run build:app

echo ""
echo "==> Compilando backend (NestJS)..."
npm run build:api

# --- Iniciar / Reiniciar con PM2 ---
echo ""
echo "==> Iniciando servidor con PM2..."
cd "$PROJECT_DIR"

if pm2 describe my-strategee > /dev/null 2>&1; then
  echo "  Proceso existente encontrado, reiniciando..."
  pm2 restart my-strategee
else
  echo "  Creando nuevo proceso PM2..."
  pm2 start npm --name "my-strategee" -- start
fi

pm2 save
pm2 startup

echo ""
echo "========================================"
echo "  Deploy completado exitosamente!"
echo "========================================"
