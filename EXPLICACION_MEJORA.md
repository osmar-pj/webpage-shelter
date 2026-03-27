# Explicación de la Mejora: Diseño de Marcadores Industrial/Mina

Se ha realizado una actualización completa del diseño de los marcadores 3D para alinear la estética con el entorno de una mina subterránea y un socavón, manteniendo un estándar profesional y atractivo.

## 🛠️ Cambios Realizados

### 1. Organización del Código
- **Componente Independiente**: Se ha extraído toda la lógica de los marcadores a un nuevo archivo limpio: `src/components/MiningMarker.tsx`. Esto asegura que el código principal de `ModelViewer.tsx` se mantenga ordenado y que el cambio sea modular sin afectar otras partes del sistema.
- **Exportación de Interfaces**: Se exportó la interfaz `Marker` para mantener la compatibilidad de datos.

### 2. Estética "Socavón/Mina Subterránea"
El nuevo diseño utiliza elementos visuales inspirados en equipo de seguridad minera e instrumentación industrial:

- **Punto de Superficie (Sensor)**: 
  - Se reemplazó la esfera roja simple por una **base hexagonal metálica** con un núcleo brillante en naranja de seguridad.
  - Se agregó un efecto de **luz puntual (pulsante)** para simular un sensor activo en la oscuridad de la mina.
- **Línea de Conexión (Cable)**:
  - Ahora es una línea punteada de alta visibilidad en **amarillo precaución**, simulando cables de señal blindados.
- **Tag Flotante (Terminal)**:
  - **Fondo**: Estilo "Frosted Glass" oscuro (Carbón) con transparencia para no tapar totalmente el modelo.
  - **Borde**: Marco metálico negro biselado para un aspecto premium.
  - **Detalles de Seguridad**: Se agregaron esquineras en **naranja neón** y una barra superior de identificación.
  - **ID de Sensor**: Cada marcador genera automáticamente un código visual (ej: `REFUGIO-SEC-4A2D`) basado en su ID único.
  - **Indicador de Estado**: Se incluyó un pequeño LED verde con el texto "OPERATIVO" para dar realismo funcional.

### 3. Usabilidad y Rendimiento
- Se mantuvo la funcionalidad de **arrastre dinámico** (drag & drop) para que el usuario pueda reubicar las etiquetas según sea necesario.
- El texto ahora es más grande y nítido, optimizado con fuentes de alta legibilidad (`Inter`).
- Los marcadores siguen mirando siempre a la cámara (`billboarding`) para una lectura perfecta desde cualquier ángulo.

---

## 🚀 Impacto
Este cambio afecta a todos los marcadores existentes y a cualquier nuevo marcador que se agregue mediante doble clic, asegurando una identidad visual coherente en todo el proyecto.
