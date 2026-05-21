<div align="center">
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=3000&pause=200&color=00FFA3&vCenter=true&random=false&width=500&lines=Synapse+-+Motor+de+Crecimiento+Personal" alt="Typing SVG" />
</a>
</div>

<div align="center">
  
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue)](LICENSE)

Aplicación web full-stack de Gestión de Conocimiento Personal (PKM) que optimiza la captura, organización y aprendizaje activo de información mediante procesamiento asistido por inteligencia artificial.

</div>


## Inicio Rápido

### Opción 1: Con Docker (recomendado) - 2 minutos

```bash
# 1. Ejecutar script de inicio
bash start.sh

# 2. Editar configuración si es necesario
nano .env

# 3. Acceder: http://localhost:8080/synapse
```

### Opción 2: Instalación Manual

**Requisitos:**
- Java 21+, Maven 3.8+, Node.js 20+, PostgreSQL 17

**Pasos:**
```bash
# 1. Base de datos
createdb synapse

# 2. Variables de entorno
export DB_PASSWORD="tu_contraseña"
export JWT_SIGN_KEY="$(openssl rand -base64 48)"
export API_KEY_LLAMA="tu_clave_groq"

# 3. Compilar y ejecutar
mvn clean install spring-boot:run

# 4. Acceder: http://localhost:8080/synapse
```

## Características

- **Bandeja de Entrada Digital** - Captura sin fricción (texto, URLs, archivos, audio)
- **Procesamiento IA** - Clasificación automática con Llama 3.3 70B
- **Verificación de Hechos** - Validación de afirmaciones con IA
- **Análisis de Tendencias** - Gráficos radar de patrones de conocimiento
- **Interfaz Retro Arcade** - Navegación y consumo intuitivo de notas
- **Notificaciones Tiempo Real** - WebSocket con persistencia local
- **Markdown Adaptativo** - Renderizado inteligente con YouTube/audio embebido

## Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Backend | Java 21, Spring Boot 3.3.4, Spring Security |
| Frontend | React 18, React Router |
| Base de Datos | PostgreSQL 17 |
| IA/LLM | Llama 3.3 70B (Groq API) |
| Autenticación | JWT (jjwt 0.12.6) |
| Tiempo Real | WebSocket, Java-WebSocket |
| Containerización | Docker, docker-compose |

## Configuración

Todas las configuraciones están en `.env.example`:

```bash
cp .env.example .env
nano .env
```

**Variables principales:**
- `DB_PASSWORD` - Contraseña PostgreSQL
- `JWT_SIGN_KEY` - Clave para firmar tokens (se genera automáticamente)
- `API_KEY_LLAMA` - Clave de API de Groq (obtén en https://console.groq.com)

## Comandos Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Detener servicios
docker-compose stop

# Reiniciar servicios
docker-compose restart

# Reinicio completo (elimina BD)
docker-compose down -v
docker-compose up -d

# Ver estado de servicios
docker-compose ps
```

## Endpoints API

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/users/signUp` | — | Registro de usuario |
| POST | `/api/users/login` | — | Login (devuelve JWT) |
| POST | `/api/brains/suggestions` | Sí | Clasificar contenido con IA |
| GET | `/api/brains/previews?url=...` | Sí | Extraer metadatos URL |
| POST | `/api/brains/notes` | Sí | Guardar nota como Markdown |
| DELETE | `/api/brains/notes/{id}` | Sí | Eliminar nota |
| POST | `/api/brains/fact-checks` | Sí | Verificar hechos con IA |
| WS | `/ws/**` | Sí | WebSocket notificaciones |

## Solución de Problemas

**Puerto 8080 en uso:**
```bash
lsof -i :8080
kill -9 <PID>
```

**Falla conexión a BD:**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U synapse -d synapse
```

**La app no inicia:**
```bash
docker-compose logs app
# Verificar variables en .env
docker-compose exec app env | grep DB_
```

**Cambiar puerto:**
Edita `docker-compose.yml` y modifica: `ports: ["9090:8080"]`

## Documentación

- [SECURITY.md](SECURITY.md) - Seguridad, autenticación, despliegue
- [LICENSE](LICENSE) - GNU GPL v3.0

## Autores

- Heitor Cambre García (heitor.cambre@udc.es)
- Xián Cotelo Varela (x.cotelo@udc.es)
- Diego Viqueira Sebe (d.vsebe@udc.es)

---

**Versión**: 1.0.0 | **Licencia**: GPL-3.0 | **Stack**: Java + React + PostgreSQL
