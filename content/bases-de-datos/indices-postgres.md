---
title: Índices en PostgreSQL
summary: Cómo funcionan los índices B-tree, cuándo ayudan, cuándo no, y cómo leer un EXPLAIN ANALYZE.
level: Intermedio
tags: [postgres, sql, indices, performance]
related: []
sources: [Docs: Índices|https://www.postgresql.org/docs/current/indexes.html, Docs: Using EXPLAIN|https://www.postgresql.org/docs/current/using-explain.html, Docs: Tipos de índice|https://www.postgresql.org/docs/current/indexes-types.html]
---

## Teoría

Un **índice** es una estructura auxiliar que permite encontrar filas sin recorrer toda la tabla (*sequential scan*). Cuesta espacio y ralentiza escrituras (INSERT/UPDATE/DELETE deben mantenerlo), así que se crea para consultas concretas, no "por las dudas".

Tipos principales en PostgreSQL:

| Tipo | Úsalo para |
|---|---|
| **B-tree** (por defecto) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, prefijos de `LIKE 'abc%'` |
| **Hash** | sólo igualdad |
| **GIN** | `jsonb`, arrays, búsqueda de texto completo |
| **GiST / BRIN** | geometría / tablas enormes ordenadas físicamente |

## Ejemplos con código

```sql
CREATE INDEX idx_pedidos_cliente_fecha ON pedidos (cliente_id, creado_en DESC);

-- Índice parcial: sólo lo que consultas
CREATE INDEX idx_pedidos_pendientes ON pedidos (creado_en) WHERE estado = 'PENDIENTE';

-- ¿Se usa?
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM pedidos WHERE cliente_id = 42 ORDER BY creado_en DESC LIMIT 10;
```

Salida esperada: `Index Scan using idx_pedidos_cliente_fecha`, en lugar de `Seq Scan on pedidos`.

## Cómo funciona por dentro

- Un B-tree es un árbol balanceado de **páginas de 8 KB**. Las hojas contienen la clave y un puntero (**TID**: página + posición) a la fila en el *heap*. Buscar es O(log n): pocos saltos aun con millones de filas.
- En un índice compuesto `(a, b)` el orden importa: sirve para `a`, y para `a` + `b`, pero **no** para filtrar sólo por `b` (regla del prefijo izquierdo).
- El **planner** decide con estadísticas (`ANALYZE`, `pg_stats`): si una consulta devuelve gran parte de la tabla, un seq scan es más barato que miles de saltos aleatorios.
- Por **MVCC**, UPDATE crea una nueva versión de fila y puede requerir nuevas entradas de índice; `VACUUM` limpia las versiones muertas. *Index-only scan* evita leer el heap si la visibility map lo permite.

## Por qué importa

Es la palanca de rendimiento nº 1 en backends con Spring Data JPA: un `findByClienteId` sin índice se vuelve lento al crecer la tabla. Además es pregunta fija de entrevista: "tengo una query lenta, ¿qué haces?".

## Error típico

- Indexar columnas de baja cardinalidad (ej. booleano) sin índice parcial.
- Envolver la columna en una función: `WHERE lower(email) = ...` no usa un índice sobre `email` (hace falta un índice de expresión).
- Orden incorrecto en índices compuestos.
- Crear demasiados índices y penalizar las escrituras.
- Olvidar índices en las **foreign keys** (Postgres no los crea solo).

## Explícalo desde cero

Es como el índice alfabético al final de un libro: en vez de leer las 800 páginas buscando "Docker", vas al índice, ves la página y saltas. A cambio, cada vez que añades contenido, tienes que actualizar el índice.

## Preguntas de entrevista

### Una query lenta, ¿cómo la investigas?

`EXPLAIN (ANALYZE, BUFFERS)`: miro si hay Seq Scan sobre tabla grande, diferencia entre filas estimadas y reales (estadísticas desactualizadas → `ANALYZE`), y el orden de los joins. Luego decido índice, reescritura de la query o cambio de esquema.

**Qué evalúa:** método, no sólo "pongo un índice".

### ¿Por qué Postgres ignora mi índice?

Posibles causas: la consulta devuelve demasiadas filas, la columna está envuelta en una función, tipos no coinciden (cast implícito), estadísticas viejas, o la tabla es pequeña.

**Qué evalúa:** comprensión del planner.

### ¿Cuándo un índice compuesto es mejor que dos índices simples?

Cuando las consultas filtran por ambas columnas juntas; el compuesto resuelve todo en una pasada. Dos simples obligan a combinar con *bitmap AND* y suelen ser peores.

**Qué evalúa:** diseño de índices.

## Reglas de oro

- Mide con `EXPLAIN ANALYZE` antes y después.
- Indexa para consultas reales; elimina los que no se usan (`pg_stat_user_indexes`).
- Índices en FKs y en columnas de `WHERE`/`ORDER BY` frecuentes.
