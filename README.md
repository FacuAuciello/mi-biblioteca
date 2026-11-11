# Mi Biblioteca

Biblioteca personal de estudio para entrevistas técnicas: Java + Spring, JavaScript/TypeScript/React, bases de datos y despliegue. Cada tema incluye teoría, ejemplos con código, cómo funciona por dentro, errores típicos, preguntas de entrevista con respuesta colapsable, fuentes oficiales y notas personales.

Stack: Vite + React + TypeScript, react-markdown, Shiki.

## Uso

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build estático (apto para Vercel/Cloudflare Pages)
```

## Agregar un tema

Crea `content/<area>/<slug>.md` (áreas: `java-spring`, `js-ts-react`, `bases-de-datos`, `despliegue`). Aparece solo en el sidebar.

```md
---
title: Nombre del tema
summary: Una línea.
level: Intermedio
tags: [a, b]
related: [otro-slug]
sources: [Etiqueta|https://url, Otra|https://url]
---

## Teoría
## Ejemplos con código
## Cómo funciona por dentro
## Por qué importa
## Error típico
## Explícalo desde cero
## Preguntas de entrevista
### Pregunta 1
Respuesta…
## Reglas de oro
```

"Se conecta con", "Fuentes oficiales" y "Notas" se generan desde el frontmatter. Las notas se guardan en `localStorage`.

## Más información
- `CONTEXT.md`: objetivo, alcance y decisiones del proyecto.
- `TODO.md`: pendientes y próximos pasos.
