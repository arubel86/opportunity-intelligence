# 💎 Estándar Global de Menús Desplegables y Buscadores (UI Standards)

Esta regla debe aplicarse en **todos los proyectos y componentes** web con menús desplegables, selectores y buscadores con opciones emergentes:

### 1. Desacoplamiento Físico Obligatorio (Gap de 8px)
* **Prohibición:** Está terminantemente prohibido que un menú desplegable se monte, cubra o superponga a ras sobre la caja del buscador o input selector.
* **Norma:** Todo menú emergente o desplegable debe flotar siempre separado con un margen mínimo de **`8px` hacia abajo** (`top: calc(100% + 8px);` o `margin-top: 8px;`).
* **Estilo:** Panel flotante con fondo glassmorphism oscuro (`backdrop-filter: blur(20px)`), esquinas redondeadas (`border-radius: 10px`) y sombra envolvente (`box-shadow: 0 16px 36px rgba(0,0,0,0.7)`).

### 2. Espaciado y Padding en Opciones
* **Norma:** Las opciones desplegables (`<option>` o `.dropdown-item`) nunca deben verse apretadas ni amontonadas.
* **Mínimos obligatorios:**
  * `padding: 10px 14px;`
  * `line-height: 1.6;`
  * `min-height: 38px;`
  * Hover reactivo suave con acento de color y marca de selección activa (`✓`).

### 3. Separación de Flechas e Iconos Indicadores
* **Prohibición:** No dejar las flechitas desplegables (`v`) pegadas contra el borde derecho del contenedor.
* **Norma:**
  * Utilizar chevrons SVG vectorizados nítidos con `appearance: none;`.
  * Posición separada: `background-position: calc(100% - 15px) center;`.
  * Margen interior derecho del input: `padding-right: 40px;` para evitar colisiones con el texto.
  * Micro-animación de rotación a `180deg` al abrir.

### 4. Limpieza de Marcas de Agua
* En componentes de mapas o librerías de terceros (ej. Leaflet, Chart.js), ocultar por defecto marcas de agua y atribuciones invasivas (`attributionControl: false` y `.leaflet-control-attribution { display: none !important; }`).
