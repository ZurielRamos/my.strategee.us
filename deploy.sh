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
git config --global --add safe.directory "$PROJECT_DIR"
sudo chown -R www:www "$PROJECT_DIR/.git"
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

echo ""
echo "========================================"
echo "  Build completado exitosamente!"
echo "  Inicia la aplicacion desde aaPanel con: npm start"
echo "========================================"
