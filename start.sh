#!/bin/bash

# Synapse - Script de Inicio Rápido
# Ejecuta: bash start.sh

echo "========================================="
echo "  Synapse - Iniciando aplicación"
echo "========================================="
echo ""

# Crear .env si no existe
if [ ! -f .env ]; then
    echo "✓ Creando archivo .env..."
    cp .env.example .env
    
    # Generar JWT_SIGN_KEY fuerte
    JWT_KEY=$(openssl rand -base64 48 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i "s|JWT_SIGN_KEY=.*|JWT_SIGN_KEY=$JWT_KEY|" .env
    
    echo "✓ Archivo .env creado"
    echo ""
    echo "IMPORTANTE: Edita .env y configura:"
    echo "  - DB_PASSWORD: Tu contraseña de PostgreSQL"
    echo "  - API_KEY_LLAMA: Tu clave de API Groq (https://console.groq.com)"
    echo ""
fi

# Verificar que .env tiene valores
if grep -q "tu-clave-api-groq\|YOUR_PASSWORD" .env; then
    echo "⚠️  ADVERTENCIA: .env tiene valores de ejemplo"
    echo "Edita .env ANTES de continuar:"
    echo ""
    echo "  1. DB_PASSWORD - Contraseña PostgreSQL"
    echo "  2. API_KEY_LLAMA - Clave de API Groq"
    echo ""
    echo "Edita el archivo: nano .env"
    echo ""
    read -p "¿Continuar de todas formas? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Inicio cancelado."
        exit 1
    fi
fi

echo ""
echo "✓ Iniciando servicios con Docker..."
docker-compose up -d

echo ""
echo "========================================="
echo "  Synapse iniciada"
echo "========================================="
echo ""
echo "Accede a: http://localhost:8080/synapse"
echo ""
echo "Comandos útiles:"
echo "  docker-compose logs -f        # Ver logs"
echo "  docker-compose stop           # Detener"
echo "  docker-compose down -v        # Eliminar (limpia BD)"
echo ""
