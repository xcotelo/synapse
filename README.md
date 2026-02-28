# 🧠 Synapse

### Digital Brain System — HackUDC 2026 (Kelea Challenge)

---

## 🏆 Descripción del proyecto

**Synapse** es un sistema de *Digital Brain* diseñado para capturar información sin fricción y transformarla en conocimiento estructurado y reutilizable.

El proyecto aborda un problema común: la dificultad de gestionar información mientras estamos concentrados en otras tareas. En lugar de obligar al usuario a organizar en el momento, Synapse separa claramente **captura y procesamiento**, permitiendo mantener el flujo de trabajo.

---

### Synapse introduce un sistema basado en tres fases:

```text
CAPTURA → PROCESADO → CONOCIMIENTO
```

### 📥 Captura sin fricción

El usuario puede guardar cualquier tipo de información rápidamente sin necesidad de clasificarla.

### ⚙️ Procesado posterior

Las entradas se revisan más tarde, donde el sistema:

* Clasifica el contenido
* Estructura la información
* Genera notas útiles

### 🧠 Construcción de conocimiento

El resultado final son notas estructuradas, conectadas entre sí, formando una base de conocimiento personal.

---

## 🧩 Arquitectura del sistema

El sistema se organiza en los siguientes componentes:

* **Inbox (`inbox_entries`)**
  Almacena toda la información sin procesar.

* **Procesamiento (`processing_logs`)**
  Registra las acciones realizadas sobre cada entrada.

* **Notas (`notes`)**
  Contienen el conocimiento estructurado en formato Markdown.

* **Relaciones (`note_links`)**
  Permiten conectar ideas entre sí.

* **Tags (`tags`, `note_tags`)**
  Facilitan la organización y clasificación.

---

## 🔄 Flujo de funcionamiento

```text
Usuario captura información
        ↓
Se almacena en el inbox
        ↓
El sistema procesa la entrada
        ↓
Se genera una nota estructurada
        ↓
Se conecta con otras notas
```

---

## 🛠️ Tecnologías utilizadas

* Backend: (ej. FastAPI / Node.js)
* Base de datos: SQL (MySQL / SQLite)
* Formato de notas: Markdown
* (Opcional) Integración de IA para:

  * Clasificación automática
  * Resúmenes
  * Generación de contenido

---

## 🎯 Resultados

* Sistema funcional de captura y procesamiento de información
* Generación automática de notas estructuradas
* Modelo de datos optimizado para conocimiento conectado
* Base sólida para evolucionar hacia un “segundo cerebro” digital

---

## 👥 Equipo

* **Heitor Cambre García**
* **Diego Viqueira Sebe**
* **Xián Cotelo Varela**

---
