---
title: Docker
summary: Imágenes, contenedores, capas y Dockerfiles multi-stage; cómo aísla Docker un proceso y cómo empaquetar una app Spring Boot.
level: Intermedio
tags: [docker, contenedores, dockerfile, devops]
related: [hilos]
sources: [Docker: Get started|https://docs.docker.com/get-started/, Referencia de Dockerfile|https://docs.docker.com/reference/dockerfile/, Docker: Mejores prácticas de build|https://docs.docker.com/build/building/best-practices/]
---

## Teoría

Una **imagen** es una plantilla inmutable (sistema de archivos en capas + metadatos); un **contenedor** es una instancia en ejecución de una imagen. Un contenedor **no es una máquina virtual**: comparte el kernel del host y sólo aísla el proceso.

Piezas básicas: `Dockerfile` (receta), registry (Docker Hub, GHCR), `docker compose` (varios servicios: app + base de datos).

## Ejemplos con código

Dockerfile multi-stage para Spring Boot (Java 21):

```dockerfile
# Etapa 1: compilar
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline          # capa cacheable
COPY src src
RUN ./mvnw -q package -DskipTests

# Etapa 2: imagen final pequeña
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1000
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

App + Postgres con Compose:

```yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/app
    depends_on: [db]
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: secreto
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

## Cómo funciona por dentro

- **Namespaces** de Linux aíslan lo que el proceso *ve* (PIDs, red, mounts, hostname).
- **cgroups** limitan lo que el proceso *consume* (CPU, memoria).
- Las imágenes usan un **filesystem por capas** (overlayfs): cada instrucción del Dockerfile crea una capa de sólo lectura; el contenedor añade una capa escribible encima. Por eso conviene ordenar el Dockerfile de lo que menos cambia a lo que más (caché de capas).
- Los datos escritos en la capa del contenedor se pierden al eliminarlo: para persistir se usan **volúmenes**.
- En macOS/Windows, Docker corre una VM Linux ligera por debajo.

## Por qué importa

Es el estándar para desplegar en Render, Cloud Run, Kubernetes, etc. "Funciona en mi máquina" desaparece porque viaja el entorno completo. En entrevistas se pregunta por diferencias con VMs, capas y caché, y por buenas prácticas de seguridad.

## Error típico

- Usar `latest` como tag: builds no reproducibles.
- Copiar todo (`COPY . .`) antes de instalar dependencias: invalida la caché en cada cambio. Falta un `.dockerignore`.
- Correr como `root`.
- Meter secretos en la imagen (quedan en las capas) en vez de variables de entorno/secret managers.
- Guardar datos de la base de datos sin volumen.

## Explícalo desde cero

Una imagen es como una caja de comida preparada y sellada con todo lo necesario; el contenedor es esa caja ya abierta y en uso. A diferencia de una VM (una casa entera con sus propios cimientos), un contenedor es una habitación aislada dentro del mismo edificio, compartiendo cañerías (kernel).

## Preguntas de entrevista

### ¿Diferencia entre contenedor y máquina virtual?

La VM virtualiza hardware y corre un SO completo sobre un hypervisor. El contenedor comparte el kernel del host y aísla procesos con namespaces y cgroups: arranca en milisegundos y pesa mucho menos, pero con aislamiento más débil.

**Qué evalúa:** que sepas el mecanismo, no sólo "es más liviano".

### ¿Qué es un build multi-stage y por qué usarlo?

Varias etapas `FROM` en un Dockerfile: compilas con el JDK y copias sólo el artefacto a una imagen JRE. Resultado: imagen final más chica y con menor superficie de ataque.

**Qué evalúa:** buenas prácticas reales.

### ¿Cómo persistes datos en un contenedor?

Con volúmenes (gestionados por Docker) o bind mounts. La capa escribible del contenedor es efímera.

**Qué evalúa:** comprensión del modelo de capas.

## Reglas de oro

- Tags fijos, `.dockerignore`, usuario no root.
- Ordena el Dockerfile para aprovechar la caché.
- Un proceso por contenedor; config por variables de entorno.
