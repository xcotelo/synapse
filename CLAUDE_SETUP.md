# Configuración de Claude AI y Mejoras Implementadas

## Resumen de Cambios

Se ha reajustado completamente la aplicación para cumplir con el reto propuesto:

### ✅ Funcionalidades Implementadas

1. **Extracción de Contenido de URLs**
   - El sistema ahora puede extraer contenido de páginas web, videos (YouTube, Vimeo), etc.
   - Se utiliza Jsoup para el web scraping
   - Extrae título, descripción y contenido principal automáticamente

2. **Integración con Claude AI**
   - Clasificación inteligente del contenido usando Claude AI
   - Análisis automático de tipo, título, resumen, destino y etiquetas
   - Fallback a reglas básicas si Claude no está configurado

3. **Interfaz Mejorada**
   - Diseño moderno y amigable
   - Indicadores visuales claros (iconos, badges de colores)
   - Estados de carga para el procesamiento con IA
   - Mejor organización de la información

## Configuración Requerida

### 1. Configurar API Key de Claude

Para usar Claude AI, necesitas configurar tu API key. Tienes dos opciones:

#### Opción A: Variable de Entorno (Recomendado)
```bash
export CLAUDE_API_KEY="tu-api-key-aqui"
```

#### Opción B: Editar application.yml
Edita el archivo `backend/src/main/resources/application.yml` y reemplaza:
```yaml
project:
  claude:
    apiKey: ${CLAUDE_API_KEY:your-api-key-here}
```

Por:
```yaml
project:
  claude:
    apiKey: tu-api-key-real-aqui
```

### 2. Obtener API Key de Claude

1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Ve a la sección de API Keys
4. Genera una nueva API key
5. Cópiala y úsala en la configuración

### 3. Instalar Dependencias

Las nuevas dependencias se instalarán automáticamente con Maven:
- Jsoup (web scraping)
- OkHttp (cliente HTTP)
- Gson (parsing JSON)

```bash
mvn clean install
```

## Uso de la Aplicación

### Flujo de Trabajo

1. **Añadir Contenido al Inbox**
   - Accede a `/brain/inbox` (después de iniciar sesión)
   - Pega un enlace, texto, código, etc.
   - Haz clic en "Añadir al inbox"

2. **Procesar con IA**
   - Haz clic en "Procesar con IA" en cualquier entrada
   - El sistema:
     - Extrae contenido si es una URL
     - Clasifica con Claude AI
     - Sugiere título, resumen, destino y etiquetas

3. **Revisar y Guardar**
   - Revisa las sugerencias de IA
   - Edita si es necesario
   - Guarda la nota procesada

4. **Explorar Conocimiento**
   - Ve a `/brain/knowledge` para ver todas las notas procesadas
   - Busca y filtra por etiquetas

## Características de la IA

### Tipos de Contenido Detectados
- 🔗 **Link**: Enlaces a páginas web
- 🎥 **Video**: Videos de YouTube, Vimeo, etc.
- 📝 **Nota**: Texto general
- ✓ **Tarea**: Listas de tareas
- 💻 **Código**: Fragmentos de código

### Clasificación Inteligente
Claude AI analiza el contenido y sugiere:
- **Tipo**: Categoría del contenido
- **Título**: Título descriptivo
- **Resumen**: Resumen de los puntos clave
- **Destino**: Dónde clasificar (apunte, idea, recurso, tarea)
- **Etiquetas**: Etiquetas relevantes para organización

## Notas Técnicas

### Sin API Key de Claude
Si no configuras la API key, el sistema funcionará con reglas básicas (fallback), pero sin la inteligencia de Claude AI.

### Límites
- Contenido extraído limitado a 50,000 caracteres
- Timeout de 10 segundos para extracción web
- Claude API tiene límites de rate según tu plan

### Seguridad
- Nunca commitees tu API key en el repositorio
- Usa variables de entorno en producción
- El API key se lee desde `application.yml` o variable de entorno

## Estructura de Archivos Nuevos

```
backend/src/main/java/rest/services/
├── ContentExtractionService.java  # Extracción de contenido web
└── ClaudeAIService.java            # Integración con Claude AI

frontend/src/modules/digitalbrain/
├── components/
│   ├── DigitalBrainInbox.jsx          # Mejorado
│   └── DigitalBrainProcessEntry.jsx   # Mejorado
└── services/
    └── brainService.js                # Nuevo
```

## Troubleshooting

### Error: "No se pudieron cargar sugerencias automáticas"
- Verifica que la API key esté configurada correctamente
- Revisa la conexión a internet
- Verifica que tengas créditos en tu cuenta de Claude

### Error al extraer contenido de URL
- Algunas páginas pueden bloquear el scraping
- Verifica que la URL sea accesible
- El sistema usará la URL original si falla la extracción

### Los errores del linter
- Los errores de "package does not match" son falsos positivos
- El código compilará correctamente con Maven
- Recarga el proyecto en tu IDE si es necesario
