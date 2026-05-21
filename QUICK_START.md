# Inicio Rápido - Synapse

## 🚀 En 2 minutos

```bash
# Paso 1: Ejecutar script de inicio
bash start.sh

# El script:
# ✓ Crea .env automáticamente si no existe
# ✓ Genera JWT_SIGN_KEY fuerte
# ✓ Inicia servicios con Docker

# Espera a que los servicios estén listos (10-30 segundos)
```

## ⚙️ Configurar (si es necesario)

Si `start.sh` muestra advertencia, edita `.env`:

```bash
nano .env
```

Variables críticas a cambiar:
- `DB_PASSWORD` - Tu contraseña PostgreSQL
- `API_KEY_LLAMA` - Tu clave de API Groq (https://console.groq.com)

## 🌐 Acceder

Abre tu navegador:
```
http://localhost:8080/synapse
```

## 📝 Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Detener
docker-compose stop

# Reiniciar servicios
docker-compose restart

# Reinicio completo (borra BD)
docker-compose down -v
docker-compose up -d

# Conectarse a BD
docker-compose exec postgres psql -U synapse -d synapse
```

## ❌ Solucionar Problemas

**"El puerto 8080 ya está en uso"**
```bash
lsof -i :8080
kill -9 <PID>
docker-compose restart
```

**"Falla la conexión a la BD"**
```bash
docker-compose logs postgres
# Verifica que DB_PASSWORD en .env sea correcto
```

**"La app no inicia"**
```bash
docker-compose logs app
# Busca errores de configuración
```

## 📚 Documentación Completa

Ver [README.md](README.md) para:
- Instalación manual sin Docker
- Arquitectura del proyecto
- API endpoints completa
- Seguridad

---

**¿Listo?** Ejecuta: `bash start.sh`
