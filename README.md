# Galeras Watch — Consola de monitoreo del volcán Galeras

Proyecto para la clase de **Programación Orientada a la Web** (métricas de rendimiento).
Es una consola de monitoreo en tiempo real de un volcán —inspirada en el Galeras, que
está a pocos kilómetros de Pasto— que sirve como caso de estudio para demostrar, con
código real y medible:

- El **event loop** de JavaScript: cómo se gestionan **tasks (macrotasks)** y
  **microtasks**, y el orden garantizado en que se ejecutan.
- Cómo una operación puede **bloquear el hilo principal** (y congelar la UI) y cómo
  la misma operación puede **desbloquearlo** cediendo el control al event loop.
- **INP (Interaction to Next Paint)**, medido en vivo en el navegador con la librería
  oficial `web-vitals`, con el objetivo de mantenerlo por debajo de **200 ms**.
- Todo el código está en **inglés** y organizado con **POO** (clases con
  responsabilidad única, sin lógica de negocio dentro de los componentes de React).

> Caso de estudio elegido: en vez de un carrito de compras o un chat (los ejemplos
> típicos de estas tareas), la app simula la red de sensores sísmicos, de SO2 y de
> temperatura de un volcán, más un modelo de dispersión de ceniza. Es un dominio poco
> común para este tipo de ejercicio y, al vivir en Pasto, es un contexto que se
> entiende de inmediato frente al jurado o el profesor.

## Índice

1. [Stack elegido y por qué](#1-stack-elegido-y-por-qué)
2. [Dónde está cada requisito del taller](#2-dónde-está-cada-requisito-del-taller)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Requisitos previos](#4-requisitos-previos)
5. [Cómo ejecutar el proyecto localmente](#5-cómo-ejecutar-el-proyecto-localmente)
6. [Cómo comprobar el INP](#6-cómo-comprobar-el-inp)
7. [Subir el proyecto a tu repositorio de GitHub](#7-subir-el-proyecto-a-tu-repositorio-de-github)
8. [Desplegar en la nube (Vercel)](#8-desplegar-en-la-nube-vercel)
9. [Alternativa de despliegue: Netlify](#9-alternativa-de-despliegue-netlify)
10. [Guion de demostración para sustentar](#10-guion-de-demostración-para-sustentar)

---

## 1. Stack elegido y por qué

**React 19 + TypeScript + Vite**, con la librería `web-vitals` para medir INP.

¿Por qué este stack y no Angular o Vue?

- **Vite** genera una carpeta `dist/` 100% estática (HTML + JS + CSS). No necesita
  servidor Node corriendo en producción, así que se puede subir a **cualquier**
  hosting estático (Vercel, Netlify, GitHub Pages, Cloudflare Pages) sin configurar
  nada más que "build command" y "output directory".
- Como de todas formas vas a subir el código a GitHub, el flujo **GitHub → Vercel**
  es literalmente: conectar la cuenta, elegir el repositorio y dar clic en "Deploy".
  Vercel detecta Vite automáticamente. Es el camino con menos fricción de todos los
  frameworks que mencionaste.
- Angular tiene un build más pesado y una curva de configuración mayor para algo tan
  acotado; Vue es una alternativa igual de válida y también fácil de desplegar, pero
  el ecosistema de React (y su integración con `web-vitals`, que es la librería de
  referencia de Google para Core Web Vitals) es el más directo para este caso.

## 2. Dónde está cada requisito del taller

| Requisito | Dónde está en el código |
|---|---|
| POO | Todas las clases en `src/core/*.ts`: `SeismicSensor`, `SensorNetwork`, `AlertManager`, `EventLoopScheduler`, `AshDispersionCalculator`, `INPMonitor`. Cada una encapsula su propio estado y expone métodos públicos; los componentes de React solo las orquestan. |
| Gestión de **tasks** (macrotasks) | `EventLoopScheduler.scheduleMacrotask()` (usa `setTimeout`) y `SensorNetwork.startPolling()` (usa `setInterval`), en `src/core/EventLoopScheduler.ts` y `src/core/SensorNetwork.ts`. |
| Gestión de **microtasks** | `EventLoopScheduler.scheduleMicrotask()` (usa `queueMicrotask`) y `scheduleMicrotaskViaPromise()` (usa `Promise.resolve().then()`), en `src/core/EventLoopScheduler.ts`. `AlertManager` también despacha las alertas críticas como microtasks. |
| Orden garantizado micro > macro | Botón **"Run ordering demo"** → `EventLoopScheduler.demonstrateOrdering()`, con el log visual en el panel "Event loop scheduler". |
| **Bloquear** el hilo principal | Botón **"Run blocking (sync)"** → `AshDispersionCalculator.computeSync()`, en `src/core/AshDispersionCalculator.ts`. Congela la UI mientras corre. |
| **Desbloquear** el hilo principal | Botón **"Run optimized (chunked)"** → `AshDispersionCalculator.computeChunked()`, misma clase. Hace el mismo trabajo pero cede el control cada 8 filas con `await new Promise(resolve => setTimeout(resolve, 0))`. |
| Medición de **INP** | `src/core/INPMonitor.ts`, que envuelve `onINP` de `web-vitals`. El valor se ve en vivo en la insignia superior derecha y en el panel "INP — Interaction to Next Paint". |
| Objetivo INP < 200 ms | `INPThresholds[0]` de `web-vitals` es 200 ms; se muestra explícitamente en el panel de rendimiento. |

## 3. Estructura del proyecto

```
galeras-event-loop-monitor/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                    # punto de entrada de React
    ├── App.tsx                     # orquesta las clases y arma el layout
    ├── App.css
    ├── index.css
    ├── types/
    │   └── index.ts                # tipos compartidos (SensorReading, VolcanoAlert, etc.)
    ├── core/                       # clases POO, sin JSX, sin dependencias de React
    │   ├── SeismicSensor.ts        # una estación sísmica individual
    │   ├── SensorNetwork.ts        # red de sensores + patrón Observer + polling (macrotask)
    │   ├── AlertManager.ts         # clasifica lecturas y despacha alertas (micro/macrotask)
    │   ├── EventLoopScheduler.ts   # demo explícita de tasks vs microtasks
    │   ├── AshDispersionCalculator.ts # cálculo bloqueante vs. cálculo por chunks
    │   └── INPMonitor.ts           # envoltorio de web-vitals (onINP)
    └── components/                 # componentes de presentación (reciben props, sin lógica de negocio)
        ├── SeismographStrip.tsx
        ├── SensorFeed.tsx
        ├── AshDispersionGrid.tsx
        ├── EventLoopVisualizer.tsx
        ├── AlertPanel.tsx
        └── PerformancePanel.tsx
```

## 4. Requisitos previos

- **Node.js 20.19+ o 22.12+** (Vite 8 lo exige). Descárgalo de
  [nodejs.org](https://nodejs.org/) — instala la versión LTS. Verifica con:
  ```bash
  node -v
  npm -v
  ```
- **Git** instalado y una cuenta de GitHub.
- Una cuenta gratuita en [Vercel](https://vercel.com) (puedes entrar con tu cuenta de
  GitHub, sin tarjeta de crédito).

## 5. Cómo ejecutar el proyecto localmente

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

## 6. Cómo comprobar el INP

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

## 7. Subir el proyecto a tu repositorio de GitHub

Tu repositorio es `https://github.com/JuanMaya8/taller_metricas_rendimiento.git`.
La forma más segura de evitar conflictos es clonarlo primero y copiar el proyecto
adentro:

```bash
# 1. Clona tu repositorio (en una carpeta aparte de donde descomprimiste el ZIP)
git clone https://github.com/JuanMaya8/taller_metricas_rendimiento.git
cd taller_metricas_rendimiento

# 2. Copia TODO el contenido de galeras-event-loop-monitor/ dentro de esta carpeta
#    (en Windows, simplemente copia y pega los archivos con el Explorador de
#    archivos; en Linux/Mac puedes usar cp -r ../galeras-event-loop-monitor/* .)

# 3. Verifica que node_modules y dist NO se vayan a subir (ya están en .gitignore)
git status

# 4. Agrega, comitea y sube
git add .
git commit -m "Add Galeras Watch: event loop, blocking demo and live INP console"
git push origin main
```

Notas:

- Si tu repositorio ya tiene commits previos (por ejemplo un README inicial) y `git
  push` te rechaza el push, primero trae los cambios remotos:
  ```bash
  git pull origin main --allow-unrelated-histories
  ```
  resuelve cualquier conflicto que marque Git, y vuelve a hacer `git add . && git
  commit` y `git push origin main`.
- Si la rama principal de tu repo se llama `master` en vez de `main`, cambia el
  último comando por `git push origin master`.
- Si es la primera vez que usas Git en esa máquina, configura tu identidad antes de
  comitear:
  ```bash
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu_correo@ejemplo.com"
  ```
- GitHub ya no acepta la contraseña de tu cuenta para autenticar `git push` desde la
  terminal: usa un **Personal Access Token** (Settings → Developer settings →
  Personal access tokens) como contraseña cuando Git te la pida, o configura SSH.

## 8. Desplegar en la nube (Vercel)

Con el código ya en GitHub (paso anterior), el despliegue es así:

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Clic en **"Add New..." → "Project"**.
3. Elige el repositorio `taller_metricas_rendimiento` en la lista (autoriza el
   acceso a tus repos si te lo pide).
4. Vercel detecta automáticamente que es un proyecto **Vite**: el "Build Command"
   queda como `npm run build` y el "Output Directory" como `dist`. No necesitas
   tocar nada.
5. Clic en **Deploy** y espera 1-2 minutos.
6. Al terminar, Vercel te da una URL pública (algo como
   `https://taller-metricas-rendimiento.vercel.app`). Ábrela desde el celular o
   desde otro computador para probar el INP en condiciones reales de red.
7. Cada vez que hagas `git push` a la rama `main`, Vercel vuelve a desplegar
   automáticamente. No hay que repetir estos pasos.

## 9. Alternativa de despliegue: Netlify

Si prefieres Netlify en vez de Vercel:

1. Entra a [app.netlify.com](https://app.netlify.com) e inicia sesión con GitHub.
2. **"Add new site" → "Import an existing project"** → elige GitHub → selecciona
   `taller_metricas_rendimiento`.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Clic en **Deploy site**.

## 10. Guion de demostración para sustentar

Un recorrido corto y ordenado para mostrarle al profesor exactamente lo que pide el
taller, una vez la app esté corriendo (local o ya desplegada):

1. **Contexto del caso de estudio**: explica que es una consola de monitoreo
   volcánico simulada, con sensores sísmicos, alertas y un modelo de dispersión de
   ceniza — y por qué se eligió un dominio distinto a los típicos de e-commerce/chat.
2. **Tasks y microtasks**: en el panel "Event loop scheduler", clic en
   **"Run ordering demo"**. Muestra en el log que las dos entradas MICRO aparecen
   siempre antes que la entrada MACRO, aunque el macrotask se programó primero y con
   0 ms de delay — porque la cola de microtasks se vacía por completo antes de que
   el event loop tome el siguiente macrotask.
3. **Bloqueo del hilo principal**: clic en **"Run blocking (sync)"** en el panel de
   dispersión de ceniza. Mientras corre, intenta hacer clic en cualquier otro botón:
   no responde. Al terminar, señala el tiempo de cómputo mostrado y el salto del INP
   a "poor" en el panel de rendimiento.
4. **Desbloqueo del hilo principal**: clic en **"Run optimized (chunked)"**. Mismo
   trabajo, pero ahora la interfaz sigue respondiendo (puedes reconocer alertas,
   parar el polling, etc. mientras corre), y el INP se mantiene por debajo de
   200 ms.
5. **Cierre**: muestra el código de `AshDispersionCalculator.ts` lado a lado —
   `computeSync()` vs `computeChunked()` — y señala que la única diferencia real es
   el `await new Promise(resolve => setTimeout(resolve, 0))` cada 8 filas, que le
   devuelve el control al event loop.
