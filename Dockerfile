# ============================================================================
# SYNAPSE - Multi-Stage Docker Build
# Stage 1: Build backend + frontend using Maven
# Stage 2: Runtime image with optimized layers
# ============================================================================

# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21 as builder

WORKDIR /app

# Copy Maven configuration and POM files
COPY pom.xml .
COPY backend/pom.xml ./backend/

# Copy source code
COPY backend ./backend/
COPY frontend ./frontend/

# Build the application
# - Clean and compile
# - Skip tests for faster builds (CI should run tests separately)
# - Package as JAR with frontend bundled
RUN mvn clean package -DskipTests -q && \
    echo "Build completed successfully" && \
    ls -lh backend/target/

# ============================================================================
# Stage 2: Runtime stage - minimal production image
# ============================================================================

FROM eclipse-temurin:21-jdk-alpine

LABEL maintainer="Synapse Team <x.cotelo@udc.es>"
LABEL description="Personal Knowledge Management Engine"
LABEL version="1.0.0"

# Install curl for health checks
RUN apk add --no-cache curl tini

# Create non-root user for security
RUN addgroup -S synapse && \
    adduser -S synapse -G synapse

# Set working directory
WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder --chown=synapse:synapse /app/backend/target/Synapse-*.jar /app/app.jar

# Create directories for notes and uploads
RUN mkdir -p /app/digital-brain-notes /app/uploads && \
    chown -R synapse:synapse /app

# Switch to non-root user
USER synapse

# Expose application port
EXPOSE 8080

# Health check endpoint (requires app to be running)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/synapse/api/hello || exit 1

# Use tini as PID 1 to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start Spring Boot application
CMD ["java", \
     "-XX:+UseG1GC", \
     "-XX:MaxGCPauseMillis=200", \
     "-XX:+HeapDumpOnOutOfMemoryError", \
     "-XX:HeapDumpPath=/app/heapdump.hprof", \
     "-Dfile.encoding=UTF-8", \
     "-Duser.timezone=UTC", \
     "-jar", "/app/app.jar"]
