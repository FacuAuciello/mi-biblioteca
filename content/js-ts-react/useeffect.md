---
title: useEffect y el ciclo de render
summary: Cuándo corre un efecto en React, qué significa el array de dependencias y cómo evitar closures obsoletas y fugas.
level: Intermedio
tags: [react, hooks, useEffect, render]
related: [hilos]
sources: [React: Sincronizar con efectos|https://react.dev/learn/synchronizing-with-effects, React: Quizás no necesites un efecto|https://react.dev/learn/you-might-not-need-an-effect, Referencia de useEffect|https://react.dev/reference/react/useEffect]
---

## Teoría

En React, un componente es una **función que describe la UI para un estado dado**. Cada render es una "foto" con sus propios valores de props y state. `useEffect` sirve para **sincronizar el componente con algo externo** (red, DOM, suscripciones, timers), no para calcular datos derivados.

Un efecto corre **después** de que React pintó el render, y se vuelve a ejecutar sólo si cambió alguna dependencia.

| Dependencias | Cuándo corre |
|---|---|
| sin array | después de cada render |
| `[]` | una vez al montar (y limpieza al desmontar) |
| `[a, b]` | al montar y cada vez que `a` o `b` cambian |

## Ejemplos con código

```tsx
function Usuario({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/users/${id}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then(setUser)
      .catch((e) => { if (e.name !== 'AbortError') throw e })

    return () => ctrl.abort() // limpieza: cancela si cambia id o se desmonta
  }, [id])

  return <p>{user?.name ?? 'Cargando…'}</p>
}
```

## Cómo funciona por dentro

1. React ejecuta tu componente (render) y calcula el árbol de elementos.
2. Hace *commit* al DOM.
3. Después del pintado, corre los efectos. Antes de volver a correr un efecto, ejecuta la **función de limpieza del render anterior**.
4. Compara las dependencias con `Object.is` respecto al render previo; si ninguna cambió, salta el efecto.

Cada efecto **captura (closure)** los valores de su render. Si omites una dependencia, el efecto lee un valor viejo: es la causa de las "stale closures". En desarrollo, `StrictMode` monta, desmonta y vuelve a montar a propósito para exponer limpiezas faltantes.

## Por qué importa

Es la pregunta de React más frecuente en entrevistas porque revela si entiendes el modelo mental de render + closures, no sólo la sintaxis. Además conecta con rendimiento (renders innecesarios) y con la gestión de recursos (fugas de listeners/timers).

## Error típico

- Poner en un efecto lo que se puede **calcular durante el render** (estado derivado) o resolver en un event handler.
- Dependencias omitidas "para que no se repita": genera datos obsoletos. Solución: incluirlas o reestructurar.
- Objetos/funciones creados en el render como dependencia: cambian de identidad en cada render y el efecto corre siempre. Usa `useMemo`/`useCallback` o mueve la lógica dentro del efecto.
- No limpiar suscripciones ni cancelar fetch: condiciones de carrera y fugas.

## Explícalo desde cero

Piensa en el componente como una receta que se vuelve a escribir entera cada vez que algo cambia. `useEffect` es una nota adhesiva que dice: "después de servir el plato, haz esto; y si cambia el ingrediente X, vuélvelo a hacer, pero antes deshaz lo que hiciste la vez anterior".

## Preguntas de entrevista

### ¿Por qué mi efecto corre dos veces en desarrollo?

Es `StrictMode`: monta, desmonta y remonta el componente para detectar efectos sin limpieza correcta. No ocurre en producción. Si rompe algo, el efecto no es idempotente o le falta cleanup.

**Qué evalúa:** si entiendes que los efectos deben ser resistentes a remontarse.

### ¿Qué es una stale closure y cómo se arregla?

Un efecto o callback que captura valores de un render antiguo. Se arregla declarando bien las dependencias, usando la forma funcional `setX(prev => …)` o una `ref` para el valor más reciente.

**Qué evalúa:** modelo mental de closures por render.

### ¿Cuándo NO usar useEffect?

Para derivar estado de props/state (calcúlalo en el render), para responder a eventos del usuario (handler), o para resetear estado al cambiar una prop (usa `key`).

**Qué evalúa:** madurez práctica; es el consejo central de la doc oficial.

## Reglas de oro

- Un efecto = una sincronización con algo externo.
- Todo lo reactivo que usas dentro va en las dependencias.
- Si abres, cierra: devuelve siempre la limpieza.
