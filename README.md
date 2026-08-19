# Galeras Watch — Consola de monitoreo del volcán Galeras

Proyecto para la clase de **Programación Orientada a la Web** (métricas de rendimiento).
Es una consola de monitoreo en tiempo real de un volcán —inspirada en el Galeras, que
está a pocos kilómetros de Pasto con código real y medible:

- El **event loop**: cómo se gestionan **tasks (macrotasks)** y
  **microtasks**, y el orden garantizado en que se ejecutan.
- Cómo una operación puede **bloquear el hilo principal** (y congelar la UI) y cómo
  la misma operación puede **desbloquearlo** cediendo el control al event loop.
- **INP (Interaction to Next Paint)**, medido en vivo en el navegador con la librería
  oficial `web-vitals`.

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Cómo ejecutar el proyecto localmente](#2-cómo-ejecutar-el-proyecto-localmente)
3. [Cómo comprobar el INP](#3-cómo-comprobar-el-inp)

## 1. Requisitos previos

- **Node.js 20.19+ o 22.12+** (Vite 8 lo exige). Descárgalo de
  [nodejs.org](https://nodejs.org/) — instala la versión LTS. Verifica con:
  ```bash
  node -v
  npm -v
  ```
- **Git** instalado y una cuenta de GitHub.
- Una cuenta gratuita en [Vercel](https://vercel.com) (puedes entrar con tu cuenta de
  GitHub, sin tarjeta de crédito).

## 2. Cómo ejecutar el proyecto localmente

Descomprime el ZIP y, desde una terminal, entra a la carpeta del proyecto:

```bash
cd galeras-event-loop-monitor

# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

Otros comandos útiles:

```bash
# Compilar para producción (genera la carpeta dist/)
npm run build

# Servir localmente lo que quedó en dist/, para probar el build final
npm run preview
```

## 3. Cómo comprobar el INP

INP es una **métrica de campo**: se calcula a partir de interacciones reales
(clics, taps, teclas) que hace una persona, no de una simulación automática como sí
hace Lighthouse con métricas de carga. Por eso la app la mide en vivo con el
`PerformanceObserver` del navegador (a través de `web-vitals`) en vez de calcularla
"a mano". Dos formas de comprobarla:

1. **En la propia app** (la más simple): interactúa con cualquier botón y observa la
   insignia **INP** en la esquina superior derecha.
   - Interactúa normalmente (abrir/cerrar polling, reconocer alertas, correr el
     modelo "optimized/chunked") → el INP debería quedarse **verde, por debajo de
     200 ms**.
   - Da clic en **"Run blocking (sync)"** y de inmediato haz clic en cualquier otro
     botón → verás que la interfaz no responde hasta que termina el cálculo, y el
     INP saltará a **rojo/naranja, muy por encima de 200 ms**.
2. **Con Chrome DevTools** (para el sustento técnico frente al profesor):
   - Abre DevTools → pestaña **Performance**.
   - Da clic en el botón de grabar, interactúa con la app (incluyendo el botón
     "Run blocking"), y detén la grabación.
   - En la línea de tiempo verás una barra roja larga ("Long Task") durante el
     cálculo bloqueante, y en cambio varias tareas cortas separadas por espacios
     libres durante el cálculo "chunked". Eso es literalmente la diferencia entre
     bloquear y desbloquear el hilo principal.
