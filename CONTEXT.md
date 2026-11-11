# Contexto del proyecto

## Qué es
Biblioteca personal de estudio de un programador, pensada para **preparar entrevistas técnicas**. Reúne lo que se estudia y lo que se aprende trabajando. Se usa en `localhost` y también sirve como **demo para el portfolio** (screenshots + código).

## Áreas
1. Java + Spring (ecosistema completo)
2. JavaScript / TypeScript / React
3. Bases de datos (MySQL, Postgres, NoSQL, Supabase…)
4. Despliegue (Docker, Render, Vercel, Cloudflare…)

## Estilo de cada tema
Teoría · ejemplos con código · cómo funciona por dentro · por qué importa · error típico · se conecta con · explícalo desde cero · preguntas de entrevista (respuesta razonada + qué evalúa) · reglas de oro · fuentes oficiales · notas.
**No** incluye exámenes, multiple choice, katas ni seguimiento de progreso.

## Referencia
https://aprende-java.webs-economicas.es/avanzado/ (nivel Avanzado, 19 temas): Hilos, Java Memory Model, Virtual threads, Programación reactiva, Kafka, RabbitMQ, Eventos, Outbox, CQRS, Event Sourcing, API Gateway, OpenAPI, Arquitectura hexagonal, Sagas, Resiliencia, Docker, Kubernetes, Métricas, Logs y trazas.

## Decisiones técnicas
- Vite + React + TypeScript; contenido en Markdown (`content/<area>/<slug>.md`) con frontmatter, cargado con `import.meta.glob`.
- react-markdown + Shiki para el render; notas por tema en `localStorage`.
- Idioma: español, segunda persona, términos técnicos en inglés.

## Reglas para el contenido
- Basarse en **documentación oficial** y citarla en `sources`.
- Verificar versiones (Java 17/21, Spring Boot 3) antes de afirmar.

## Estado
Estructura y 4 temas modelo (hilos, useEffect, índices Postgres, Docker). Diseño pendiente de rehacer. Ver `TODO.md`.
