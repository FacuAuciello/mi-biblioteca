---
title: Hilos (threads) en Java
summary: Cómo ejecuta Java trabajo concurrente: Thread, ExecutorService, sincronización y los errores clásicos (race condition, deadlock).
level: Avanzado
tags: [concurrencia, java.util.concurrent, executor, synchronized]
related: [docker]
sources: [Javadoc java.util.concurrent|https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html, Tutorial Oracle de concurrencia|https://docs.oracle.com/javase/tutorial/essential/concurrency/, JLS cap. 17 (Threads y locks)|https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html]
---

## Teoría

Un **hilo** es la unidad mínima de ejecución dentro de un proceso. Todos los hilos de una JVM comparten el **heap** (objetos), pero cada uno tiene su propio **stack** (variables locales y llamadas). Esa asimetría explica casi todos los problemas de concurrencia: lo compartido necesita coordinación, lo local no.

Hay tres formas de crear trabajo concurrente, de menos a más recomendable:

1. `new Thread(runnable).start()`: control total, pero costoso y sin gestión del ciclo de vida.
2. `ExecutorService`: un **pool** de hilos reutilizables al que le envías tareas.
3. `CompletableFuture` / virtual threads (Java 21): composición asíncrona y hilos baratos.

## Ejemplos con código

```java
// Pool acotado, timeouts y cierre ordenado
ExecutorService pool = Executors.newFixedThreadPool(4);
try {
    Future<Integer> f = pool.submit(() -> calcularTotal(pedidoId));
    int total = f.get(2, TimeUnit.SECONDS); // bloquea hasta 2 s
} catch (TimeoutException e) {
    // la tarea sigue corriendo: hay que cancelarla explícitamente
} finally {
    pool.shutdown();
    if (!pool.awaitTermination(5, TimeUnit.SECONDS)) pool.shutdownNow();
}
```

Race condition y su arreglo:

```java
class Contador {
    private int n = 0;
    void inc() { n++; }              // NO es atómico: lee, suma, escribe
}

class ContadorSeguro {
    private final AtomicInteger n = new AtomicInteger();
    void inc() { n.incrementAndGet(); } // CAS, sin lock
}
```

## Cómo funciona por dentro

- Cada `Thread` de plataforma se mapea **1:1 a un hilo del sistema operativo**. Por eso crear miles es caro: cada uno reserva stack (~1 MB por defecto) y el planificador del SO hace los cambios de contexto.
- `synchronized` usa el **monitor** de cada objeto. La JVM empieza con un lock liviano (sesgado/thin) y lo infla a un monitor real del SO sólo si hay contención.
- `AtomicInteger` usa instrucciones **compare-and-swap (CAS)** de la CPU: intenta escribir sólo si el valor no cambió; si falló, reintenta. Sin bloqueo, pero con spinning bajo mucha contención.
- Un `ThreadPoolExecutor` tiene `corePoolSize`, `maximumPoolSize` y una **cola**. Orden real: primero llena el core, luego **encola**, y sólo si la cola está llena crea hilos hasta el máximo. Con cola ilimitada (`newFixedThreadPool`) el máximo nunca se usa.
- La visibilidad entre hilos la define el **Java Memory Model** (happens-before): sin `volatile`/lock, un hilo puede no ver nunca la escritura de otro.

## Por qué importa

Un servidor Spring atiende cada request en un hilo del pool de Tomcat (por defecto 200). Si bloqueas esos hilos con I/O lento, te quedas sin capacidad aunque la CPU esté libre. Entender pools, bloqueo y visibilidad es la base para diagnosticar latencias y para decidir entre threads clásicos, reactivo o virtual threads.

## Error típico

- Usar `Executors.newCachedThreadPool()` con carga impredecible: crea hilos sin tope y tumba la JVM.
- Olvidar `shutdown()`: los hilos no daemon impiden que la aplicación termine.
- Llamar a `future.get()` sin timeout.
- **Deadlock**: el hilo A toma lock 1 y espera lock 2; el hilo B toma lock 2 y espera lock 1. Se evita con un orden global de adquisición de locks.
- Asumir que `volatile` hace atómico a `i++` (sólo garantiza visibilidad).

## Explícalo desde cero

Imagina una cocina (proceso) con varios cocineros (hilos) que comparten la misma heladera (heap) pero cada uno tiene su propia tabla de cortar (stack). Si dos cocineros toman el último huevo a la vez, hay un problema: eso es una race condition. Un candado (lock) en la heladera lo evita, pero si cada uno espera el cuchillo del otro, nadie avanza: deadlock.

## Preguntas de entrevista

### ¿Diferencia entre `synchronized` y `volatile`?

`synchronized` da **exclusión mutua + visibilidad** (happens-before al soltar/tomar el monitor). `volatile` sólo da **visibilidad y orden** para una variable, sin exclusión: `count++` sigue sin ser atómico.

**Qué evalúa:** que distingas atomicidad de visibilidad.

### ¿Qué pasa cuando se llena la cola de un ThreadPoolExecutor?

Si hay menos hilos que `maximumPoolSize`, crea uno nuevo; si ya está en el máximo, aplica la `RejectedExecutionHandler` (por defecto lanza `RejectedExecutionException`).

**Qué evalúa:** si conoces el orden real core → cola → max → rechazo.

### ¿Cómo detectas y evitas un deadlock?

Detectar: `jstack <pid>` o `jcmd Thread.print` muestran "Found one Java-level deadlock". Evitar: orden consistente de locks, `tryLock` con timeout, reducir el alcance de la sección crítica, preferir estructuras de `java.util.concurrent`.

**Qué evalúa:** experiencia práctica de diagnóstico.

## Reglas de oro

- Prefiere `ExecutorService` a crear `Thread` a mano.
- Mutabilidad compartida: evítala; si no, usa `java.util.concurrent`.
- Todo `get()`/`await` lleva timeout; todo pool tiene cierre ordenado.
