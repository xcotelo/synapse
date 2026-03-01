<div align="center">
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=3000&pause=200&color=00FFA3&vCenter=true&random=false&width=500&lines=Synapse - Motor de Conocimiento Digital" alt="Typing SVG" />
</a>
</div>

<div align="center">
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=2500&pause=800&color=00FFA3&center=true&vCenter=true&width=700&lines=Team:+Xián+Cotelo+Varela;Heitor+Cambre+García;Diego+Viqueira+Sebe" alt="Typing SVG" />
</a>
</div>

Este documento detalla la arquitectura, decisiones de diseño, funcionalidades core y especificaciones tecnicas del proyecto Synapse, orientado a la evaluacion del jurado de la Olimpiada de Desarrollo de Software.

Synapse es una aplicacion web full-stack de Gestion de Conocimiento Personal (PKM - Personal Knowledge Management) diseñada para actuar como un "Segundo Cerebro". Optimiza los flujos de lectura, organizacion y aprendizaje activo mediante la ingesta rapida de contenido y el procesamiento asincrono habilitado por inteligencia artificial (Llama).

## 1. Arquitectura de Software y Stack Tecnologico

El sistema esta construido sobre un esquema Cliente-Servidor fuertemente desacoplado, asegurando alta mantenibilidad, latencia minima en el front-end y un manejo robusto de la persistencia de datos y procesos en back-end.

### Backend Integrador (API RESTful)
- **Nucleo**: Java 17 y Spring Boot 3.3.4.
- **Seguridad**: Autenticacion sin estado (Stateless) basada en Spring Security y JSON Web Tokens (JWT) mediante `jjwt-api` (v0.11.5).
- **Persistencia y ORM**: Spring Data JPA implementando el patron Repository sobre Hibernate, contra bases de datos relacionales (PostgreSQL en entorno de produccion y memoria H2 para simulaciones de CI/tests).
- **Extraccion de Contenido Web**: Uso de librerias especializadas en scraping (Jsoup) para derivar arboles DOM y extraer selectores como `og:title`, diccionarios meta y corpus textual eliminando el "ruido" web.
- **Comunicaciones OOB**: Cliente HTTP `OkHttp3` orquestando las llamadas hacia los endpoints locales o cloud de inferencia LLM (Generacion LLM y Fact-Checking).

### Frontend Reactivo (Single Page Application)
- **Tecnologias Core**: React 18 acoplado con React Router DOM v6.
- **Motor de Renderizado Markdown**: Integracion y parseo seguro con `react-markdown`, interviniendo a nivel de AST (Abstract Syntax Tree) para sobreescribir el comportamiento por defecto de elementos como `<h1>` o `<img>` e inyectar reproductores nativos basados en contexto.
- **Gestion de Caché Distribuido**: Sistema hibrido de estado que provee una percepcion offline-first. Los componentes gestionan hooks mutables sincronizados asincronamente con el almacenamiento nativo de navegador (`localStorage`) para los items transitorios de la bandeja de entrada, logrando latencia cero en la captura.
- **Algoritmica Frontend Avanzada**: Construccion de interfaces visuales poligonales y radiales mediante calculo analitico puro de atributos matematicos expuestos directo a dominios nativos de `<svg>` (sin depender de bibliotecas Chart pesadas de terceros).

---

## 2. Modulos y Funcionalidades Principales

### 2.1 Motor de Ingesta Unificado (Digital Inbox)
La bandeja de entrada actua como una cola FIFO asincrona disenada para no interrumpir el workflow del usuario (cero friccion).

- **Multiples Formatos**: Admite pegado directo de URLs, volcado de bloques de texto plano o carga de ficheros binarios de video y audio continuo (Drag & Drop nativo y exploracion granular).
- **Manejo Dinamico de Eventos**: Diseno defensivo de Drag & Drop implementando contadores referenciales para eliminar los repintados defectuosos recurrentes debidos a propagacion de eventos sobre capas embebidas (`pointer-events: none`).
- **Vista Previa Semantica Optimista**: Las URLs extraidas por expresiones regulares validan encabezados CORS indirectamente via backend para construir *cards* enriquecidas antes de su transformacion formal a base de datos.

### 2.2 Canalizacion Cognitiva Asistida por IA (Llama)
El modulo procesador actua como puente inteligente entre el estado `pending` y `knowledge`. A traves del `LlamaAIService`, se ejecutan prompts con restricciones de estructura y formato JSON determinista.

- **Auto-etiquetado y Taxonomia Automatica**: El modelo segrega el input, extrae la intencion original y expone sugerencias categoricas y de etiquetas (`tags`) que encajen mejor dentro del universo PKM.
- **Conversion Arquitectonica de Texto a Markdown estructurado**: Transforma contenidos extensos sin jerarquias en notas estructuradas listas para ser consumidas (secciones de sumario y viñetas).

### 2.3 Sistema Activo de Verificacion de Datos (Fact-Checking)
Funcionalidad innovadora de seguridad documental que envia y sub-procesa los textos brutos al motor LLM para validacion fáctica.

- Revisa el texto fragmentado y modela los *claims* contra umbrales configurables retornando flags tri-estado: Verdadero, Falso y Dudoso/Contexto Insuficiente.
- Implementacion Frontend de mutacion concurrente: Al generarse correcciones, se proveen acciones directas (botones) sobre el visor DOM que ejecutan funciones de sustitucion transaccional estricta en la cadena de estado origen sin requerir reentrada manual.

### 2.4 Radar Visual de Tendencias Cognitivas Analiticas
Construccion matematica compleja en puro front-end que genera graficos de radar comparando consumos de conocimiento entre dos dimensiones temporales definidas.

- Mapeo continuo de nodos en SVG donde los radios y vertices poligonales se resuelven via funciones angulares estandar `(-Math.PI / 2 + (idx * 2 * Math.PI) / n)`.
- El servicio expone a la IA de diagnostico estadistico (`/api/brain/trends/insights`) este sumario tabular para derivar insights prescriptivos, emitiendo recomendaciones constructivas del estilo "Considera ampliar conocimiento en la etiqueta Mapeo ya que su tendencia ha bajado un 42%".

### 2.5 Renderizador de Conocimiento Abstracto Adaptativo (MarkdownRenderer)
Parseo especializado que protege e intercepta los formatos web inseguros y permite reproduccion nativa *in-situ*:

- Se detectan y extraen identidades criptograficas exclusivas de plataformas (como los identificadores de video en base 64+mod de YouTube) garantizando que ninguna cadena convencional de exactamente 11 letras cruce al entorno del iFrame, blindando el visualizador ante caidas de red y fallas de incrustaciones de dominio.
- El componente unifica la UX delegando atributos HTML dinamicos como el modo `youtube-nocookie.com`.

---

## 3. Diseno de Ingenieria y Buenas Practicas

- **Construccion de Modelos Anemicos / Enriquecidos**: Los DTO (Data Transfer Objects) como el `TrendsInsightsParamsDto` previenen fugas de estructuras protegidas del ORM Data JPA y disminuyen la serializacion inyectando inmutabilidad en tiempo de ejecucion.
- **Pipeline de Despliegue Unificado**: El ciclo Maven incluye la orquestacion transitoria del sistema SPA de React (`frontend-maven-plugin`). Al requerir el faseo `package`, descarga su propia instancia portable de NodeJS, compila el front, unifica y publica estaticamente en el classpath final del jar. Esto garantiza portabilidad total desde una imagen Kubernetes en un solo comando sin acoplamiento local al SO subyacente de dev.
- **Coverage y Testing**: Pruebas configurables instrumentadas con `jacoco-maven-plugin` conectadas a las clases abstractas para monitoreo de metricas, asegurando bases sin colisiones para ciclos de integracion continuos.
