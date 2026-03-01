<div align="center">
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=3000&pause=200&color=00FFA3&vCenter=true&random=false&width=500&lines=Synapse - Motor de Crecimiento Personal" alt="Typing SVG" />
</a>
</div>

<div align="center">
  
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue)](LICENSE)

Aplicación web full-stack de Gestión de Conocimiento Personal (PKM) que optimiza la captura, organización y aprendizaje activo de información mediante procesamiento asistido por inteligencia artificial.

</div>

---

## Índice

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [API REST](#-api-rest)
- [Esquema de base de datos](#-esquema-de-base-de-datos)
- [Testing](#-testing)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Contribuidores](#-contribuidores)
- [Licencia](#-licencia)

---

## ✨ Características

### 📥 Bandeja de Entrada (Digital Inbox)
Cola de captura de contenido con cero fricción. Admite texto, URLs, ficheros de audio/vídeo (Drag & Drop), grabación de audio con micrófono y vista previa semántica de enlaces en tiempo real.

### 🤖 Procesamiento Cognitivo con IA
Pipeline inteligente que transforma entradas brutas en notas de conocimiento estructuradas en Markdown mediante **Llama 3.3 70B** (Groq API). Incluye auto-etiquetado, categorización taxonómica y generación de sumarios.

### ✅ Fact-Checking Activo
Verificación fáctica de contenido vía LLM. Analiza claims individuales y retorna un estado tri-valor (Verdadero / Falso / Dudoso) con correcciones aplicables directamente sobre la nota.

### 📊 Radar de Tendencias
Gráfico radar SVG generado algorítmicamente en frontend (sin librerías de terceros) que compara tendencias de consumo de conocimiento entre dos ventanas temporales, con diagnóstico prescriptivo generado por IA.

### 🕹️ Arcade
Interfaz retro tipo máquina recreativa para navegar y consumir notas clasificadas por tipo (vídeo, audio, web, nota), con controles de teclado y ratón, reproductor multimedia embebido y sistema de notificaciones.

### 📝 Renderizador Markdown Adaptativo
Motor de renderizado con detección inteligente de contenido multimedia: extrae IDs de YouTube para incrustar reproductores `youtube-nocookie.com`, inyecta players de audio nativos y protege contra iframes inseguros.

### 🔔 Notificaciones en Tiempo Real
Sistema de notificaciones push vía WebSocket con persistencia en `localStorage` y gestión de permisos del navegador.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Backend** | Java 17, Spring Boot 3.3.4, Spring Security, Spring Data JPA, Hibernate |
| **Frontend** | React 18, React Router DOM 6, react-markdown |
| **Base de datos** | PostgreSQL 17 (producción), H2 (tests) |
| **IA / LLM** | Llama 3.3 70B Versatile vía [Groq API](https://groq.com/) |
| **Autenticación** | JWT (jjwt 0.11.5), sesiones stateless |
| **Scraping** | Jsoup 1.17.2 |
| **HTTP Client** | OkHttp 4.12.0 |
| **WebSocket** | Spring WebSocket + Java-WebSocket 1.5.3 |
| **Build** | Maven, frontend-maven-plugin (Node 20.18 + Yarn 1.22) |
| **Testing** | JUnit 5, JaCoCo, React Testing Library |
| **Despliegue** | JAR autocontenido, Kubernetes-ready (jkube) |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      Cliente (SPA)                      │
│  React 18 · React Router · localStorage (offline-first) │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────┐
│                   Spring Boot 3.3.4                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Security │  │  REST API    │  │   WebSocket       │  │
│  │  (JWT)   │  │ Controllers  │  │   Notifications   │  │
│  └──────────┘  └──────┬───────┘  └───────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              Servicios de Dominio                 │  │
│  │  LlamaAI · ContentExtraction · MediaStorage      │  │
│  │  NoteMarkdownStorage · UserService                │  │
│  └──────────┬──────────────────┬─────────────────────┘  │
│             │                  │                         │
│  ┌──────────▼──────┐  ┌───────▼──────────────────┐     │
│  │  PostgreSQL     │  │  Filesystem              │     │
│  │  (JPA/Hibernate)│  │  digital-brain-notes/*.md│     │
│  └─────────────────┘  │  uploads/media/*         │     │
│                        └─────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Groq Cloud API    │
              │  Llama 3.3 70B      │
              └─────────────────────┘
```

El almacenamiento de notas es **dual**: PostgreSQL para datos estructurados (relaciones, tags, logs) y ficheros `.md` en disco para portabilidad y compatibilidad con herramientas externas (Git, Obsidian, etc.).

---

## 📋 Requisitos Previos

- **Java** 17+
- **Maven** 3.8+
- **Node.js** 20+ y **Yarn** 1.22+ (o dejar que Maven los descargue automáticamente)
- **PostgreSQL** 17
- Clave API de [Groq](https://console.groq.com/) para el LLM

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/xcotelo/synapse.git
cd synapse
```

### 2. Configurar la base de datos

```sql
CREATE USER synapse WITH PASSWORD '1234';
CREATE DATABASE synapse OWNER synapse;
CREATE DATABASE synapse_test OWNER synapse;
```

### 3. Configurar la clave API del LLM

```bash
export API_KEY_LLAMA="tu-clave-de-groq-aqui"
```

### 4. Build completo (backend + frontend)

```bash
mvn clean package
```

Maven descarga Node.js y Yarn automáticamente, compila el frontend con `yarn build`, ejecuta los tests y empaqueta todo en un JAR autocontenido.

### 5. Ejecutar

```bash
java -jar target/Synapse-0.1-SNAPSHOT.jar
```

La aplicación estará disponible en **http://localhost:8080/synapse**

### Desarrollo frontend independiente

```bash
cd frontend
yarn install
yarn start
```

El servidor de desarrollo se inicia en `http://localhost:3000` con proxy automático al backend en `http://localhost:8080`.

---

## ⚙️ Configuración

Las propiedades principales se definen en `backend/src/main/resources/application.yml`:

| Propiedad | Valor por defecto | Descripción |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/synapse` | URL de PostgreSQL |
| `spring.datasource.username` | `synapse` | Usuario de la BD |
| `spring.datasource.password` | `1234` | Contraseña de la BD |
| `spring.servlet.multipart.max-file-size` | `50MB` | Tamaño máximo de subida |
| `server.servlet.context-path` | `/synapse` | Ruta base de la app |
| `project.jwt.expirationMinutes` | `1440` | Duración del token JWT (24h) |
| `project.llama.model` | `llama-3.3-70b-versatile` | Modelo LLM a usar |
| `project.llama.apiUrl` | `https://api.groq.com/openai/v1/chat/completions` | Endpoint Groq |
| `project.notes.dir` | `digital-brain-notes` | Directorio de notas Markdown |

La clave API del LLM se inyecta vía variable de entorno `API_KEY_LLAMA`.

---

## 📡 API REST

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/users/signUp` | — | Registro de usuario |
| `POST` | `/api/users/login` | — | Login (retorna JWT) |
| `POST` | `/api/users/loginFromServiceToken` | — | Re-autenticación por token |
| `POST` | `/api/users/{id}/removeUser` | 🔒 | Eliminar cuenta |
| `POST` | `/api/brain/suggest` | — | Sugerencia IA para texto |
| `POST` | `/api/brain/suggest/file` | — | Sugerencia IA para fichero |
| `GET` | `/api/brain/preview` | — | Vista previa de URL (metadatos) |
| `*` | `/api/brain/notes/**` | — | CRUD de notas procesadas |
| `*` | `/api/brain/media/**` | — | Servir ficheros multimedia |
| `POST` | `/api/brain/trends/insights` | 🔒 | Análisis de tendencias con IA |
| `POST` | `/api/brain/factcheck` | 🔒 | Verificación fáctica vía LLM |
| `*` | `/ws/**` | — | WebSocket (notificaciones) |

---

## 🗄️ Esquema de Base de Datos

```
inbox_entries            info_just_process           tags
┌──────────────────┐     ┌──────────────────────┐    ┌────────────┐
│ id               │     │ id                   │    │ id         │
│ content          │◄────│ source_entry_id (FK) │    │ name       │
│ content_type     │     │ title                │    └─────┬──────┘
│ source           │     │ content (Markdown)   │          │
│ processed        │     │ note_type            │    info_just_process_tags
│ metadata         │     │ created_at           │    ┌─────┴──────┐
│ created_at       │     └──────────┬───────────┘    │ note_id    │
└──────────────────┘                │                │ tag_id     │
                                    │                └────────────┘
processing_logs              info_just_process_links
┌──────────────────┐         ┌──────────────────────┐
│ id               │         │ from_note_id (FK)    │
│ entry_id (FK)    │         │ to_note_id (FK)      │
│ action           │         │ relation_type        │
│ result           │         └──────────────────────┘
└──────────────────┘
```

- **`content_type`**: `text` | `link` | `idea` | `code`
- **`source`**: `manual` | `web` | `audio`
- **`note_type`**: `concept` | `resource` | `idea`
- **`relation_type`**: `related` | `extends` | `example`

---

## 🧪 Testing

```bash
# Tests backend (JUnit 5 + H2 in-memory)
mvn test

# Tests frontend (React Testing Library)
cd frontend && yarn test

# Cobertura (JaCoCo)
mvn verify
# Informe en target/site/jacoco/index.html
```

---

## 📁 Estructura del Proyecto

```
synapse/
├── pom.xml                          # Build unificado Maven
├── backend/
│   └── src/
│       ├── main/
│       │   ├── java/synapse/
│       │   │   ├── Application.java
│       │   │   ├── config/          # WebConfig
│       │   │   ├── model/           # Entidades JPA, DAOs, Servicios
│       │   │   └── rest/
│       │   │       ├── controllers/ # UserController, BrainController
│       │   │       ├── common/      # SecurityConfig, JWT, Advice
│       │   │       ├── dtos/        # DTOs de request/response
│       │   │       └── services/    # LlamaAI, ContentExtraction, Media
│       │   └── resources/
│       │       ├── application.yml
│       │       └── schema.sql
│       └── test/                    # Tests unitarios backend
├── frontend/
│   ├── package.json
│   ├── public/                      # Assets estáticos, sonidos
│   └── src/
│       ├── modules/
│       │   ├── app/                 # Shell de la aplicación
│       │   ├── common/              # Componentes compartidos
│       │   ├── digitalbrain/        # Módulo core (Inbox, Knowledge, Arcade)
│       │   └── user/                # Login, Registro
│       ├── styles/                  # Theme global, CSS retro
│       └── tests/                   # Tests frontend
└── digital-brain-notes/             # Notas Markdown (versionables con Git)
```

---

## 👥 Contribuidores

| Nombre | Contacto |
|---|---|
| Heitor Cambre García | heitor.cambre@udc.es |
| Xián Cotelo Varela | x.cotelo@udc.es |
| Diego Viqueira Sebe | d.vsebe@udc.es |

---
