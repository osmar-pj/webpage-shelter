# Resumen del Proyecto: SHELTER

## 🎯 Propósito
**SHELTER** (Seguridad Minera Avanzada) es una aplicación web interactiva diseñada para la visualización y gestión de refugios mineros en un entorno 3D. El objetivo principal es permitir a los usuarios explorar el diseño del refugio, identificar sus componentes críticos (como balones de oxígeno, sistemas de filtración, etc.) y gestionar anotaciones o marcadores directamente sobre el modelo 3D.

---

## 🛠️ Stack Tecnológico
El proyecto está construido con herramientas modernas para garantizar rendimiento y una experiencia de usuario premium:

- **Core**: React 19 + TypeScript + Vite.
- **Gráficos 3D**: 
  - `Three.js` para el motor de renderizado.
  - `@react-three/fiber` como puente entre React y Three.js.
  - `@react-three/drei` para utilidades y componentes 3D simplificados (controles, carga de modelos, texto, etc.).
- **Estilos**: Tailwind CSS 4 (estilos modernos y responsive).
- **Modelos**: Formato `.glb` para modelos 3D optimizados.

---

## 🚀 Funcionalidades Principales

### 1. Visor 3D Interactivo
- **Carga de Modelos**: Soporta diferentes versiones del refugio (ej. cerrado vs. abierto).
- **Controles de Cámara**: Rotación, zoom y desplazamiento (`OrbitControls`).
- **Vista Explosionada**: Animación que separa las piezas del modelo para ver el interior y los componentes.
- **Materiales y Luces**: 
  - Cambio entre modos de materiales (Estándar, Metálico, Oro, Vidrio).
  - Modos de iluminación (Estudio o Dramático).

### 2. Sistema de Marcadores (Markers)
- **Añadir Marcadores**: Doble clic sobre el modelo para colocar un punto rojo con una etiqueta de texto.
- **Interactividad**: Los marcadores se pueden arrastrar en el espacio 3D para ajustar su posición.
- **Persistencia**: Los marcadores se cargan inicialmente desde un archivo `public/markers.json`.
- **Líneas de Referencia**: Líneas dinámicas que conectan la etiqueta flotante con el punto exacto en la superficie del modelo.

### 3. Interfaz de Usuario (UI)
- **Diseño "Mine-Themed"**: Fondo oscuro con texturas de roca y efectos de partículas de polvo para simular una mina subterránea.
- **Glassmorphism**: Cards informativas (Mantenimiento, Calibración, Certificaciones) con fondo traslúcido y bordes sutiles.
- **Captura de Pantalla**: Funcionalidad para tomar una foto del visor 3D (tecla 'S').

---

## 🏗️ Estructura de Archivos Clave
- `src/components/ModelViewer.tsx`: El componente principal que contiene toda la lógica 3D, UI de control y gestión de estado.
- `src/App.tsx`: Punto de entrada que renderiza el visor.
- `src/index.css`: Definición de animaciones y el fondo temático de la mina.
- `public/markers.json`: Ubicación de los datos de los marcadores.

---

## ⌨️ Atajos y Controles
- **Doble Clic**: Agregar nuevo marcador.
- **Espacio (Mantener)**: Permite rotar el modelo manualmente con el mouse (bloqueando otros controles).
- **Tecla 'S'**: Captura de pantalla del modelo actual.
