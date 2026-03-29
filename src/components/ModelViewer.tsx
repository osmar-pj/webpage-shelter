import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import camaraModel from '../assets/camara.glb'
import camaraAbiertoModel from '../assets/camara_abierto.glb'
import acInsideModel from '../assets/air_conditioner_inside.glb'
import acOutsideModel from '../assets/air_conditioner_outside.glb'
import electricalPanelModel from '../assets/electrical_control_panel_2.glb'
import gasDetectorModel from '../assets/gas-detector.glb'
import MiningMarker from './MiningMarker'

// --- SECCIÓN DE COMPONENTES ADICIONALES (EQUIPAMIENTO) ---
// Aquí puedes añadir o modificar los equipos del refugio.
// Cambia 'position={[x, y, z]}', 'rotation={[x, y, z]}' o 'scale' para ajustarlos.

function EquipmentItem({ path, position, rotation = [0, 0, 0], scale = 0.05 }: any) {
  const gltf = useGLTF(path) as any
  return (
    <primitive
      object={gltf.scene.clone()}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  )
}

function ShelterEquipments() {
  return (
    <group>
      {/* 1. AIRE ACONDICIONADO INTERIOR (SPLIT) */}
      {/* Modifica aquí: position, scale o rotation para probar */}
      <EquipmentItem
        path={acInsideModel}
        position={[0.5, 1.3, -6.1]}
        rotation={[0, Math.PI / 50, 0]}
        scale={0.045}
      />

      {/* 2. AIRE ACONDICIONADO EXTERIOR (COMPRESOR) */}
      <EquipmentItem
        path={acOutsideModel}
        position={[0.2, 1.2, -7]}
        rotation={[0, 9.4, 0]}
        scale={0.001}
      />

      {/* 3. TABLERO ELÉCTRICO */}
      <EquipmentItem
        path={electricalPanelModel}
        position={[0.4, 0.1, -7.1]}
        rotation={[0, 7.9, 0]}
        scale={0.5}
      />

      {/* 4. DETECTOR DE GAS */}
      <EquipmentItem
        path={gasDetectorModel}
        position={[0.5, 0.7, -6.1]}
        rotation={[0, 0, 0]}
        scale={0.3}
      />
    </group>
  )
}

export interface Marker {
  id: string
  position: [number, number, number]
  text: string
  normal: [number, number, number]
  tagPosition?: [number, number, number]
}

// Tipos de materiales y modos de iluminación
type MaterialType = 'standard' | 'metallic' | 'gold' | 'glass'
type LightingMode = 'studio' | 'dramatic'

function Model({
  onModelClick,
  materialType,
  exploded,
  modelFile,
  spacePressed
}: {
  onModelClick: (position: THREE.Vector3, normal: THREE.Vector3, tagPosition: THREE.Vector3) => void
  materialType: MaterialType
  exploded: boolean
  modelFile: string
  spacePressed: boolean
}) {
  const { scene } = useGLTF(modelFile)
  const boxRef = useRef<THREE.Box3 | null>(null)
  const centerRef = useRef<THREE.Vector3 | null>(null)
  const { camera } = useThree()
  const modelRef = useRef<THREE.Group>(null)
  const originalPositions = useRef<Map<THREE.Object3D, THREE.Vector3>>(new Map())
  const lastMouseXRef = useRef<number>(0)
  const isRotatingRef = useRef<boolean>(false)

  // Guardar posiciones originales
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          originalPositions.current.set(child, child.position.clone())
        }
      })
    }
  }, [scene])

  // Aplicar materiales
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial

          switch (materialType) {
            case 'metallic':
              child.material = new THREE.MeshStandardMaterial({
                metalness: 0.9,
                roughness: 0.1,
                color: material.color || new THREE.Color(0x888888),
              })
              break
            case 'gold':
              child.material = new THREE.MeshStandardMaterial({
                metalness: 1.0,
                roughness: 0.2,
                color: new THREE.Color(0xffd700),
              })
              break
            case 'glass':
              child.material = new THREE.MeshPhysicalMaterial({
                transmission: 0.9,
                opacity: 0.3,
                roughness: 0.1,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
              })
              break
            default:
              if (!(material instanceof THREE.MeshStandardMaterial)) {
                const color = (material as any).color || new THREE.Color(0xffffff)
                child.material = new THREE.MeshStandardMaterial({
                  color: color,
                })
              }
          }
        }
      })
    }
  }, [scene, materialType])

  // Vista explosionada con animación suave
  useFrame(() => {
    if (scene && originalPositions.current.size > 0) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const originalPos = originalPositions.current.get(child)
          if (originalPos) {
            const center = centerRef.current || new THREE.Vector3(0, 0, 0)
            const direction = child.position.clone().sub(center).normalize()
            const offset = exploded ? direction.multiplyScalar(0.5) : new THREE.Vector3(0, 0, 0)
            const targetPos = originalPos.clone().add(offset)

            // Animación suave con easing
            child.position.lerp(targetPos, 0.1)
          }
        }
      })
    }
  })

  // Calcular el centro del modelo y posicionar cámara para ver eje YZ
  useEffect(() => {
    boxRef.current = new THREE.Box3().setFromObject(scene)
    centerRef.current = boxRef.current.getCenter(new THREE.Vector3())

    const size = boxRef.current.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const distance = maxDim * 2

    // Posicionar cámara en el eje Z para ver el plano XY
    camera.position.set(
      centerRef.current.x,
      centerRef.current.y,
      centerRef.current.z + distance
    )
    camera.lookAt(centerRef.current)
  }, [scene, camera])

  // Rotación con tecla espacio y mouse
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (spacePressed) {
        isRotatingRef.current = true
        lastMouseXRef.current = e.clientX
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (spacePressed && isRotatingRef.current && modelRef.current) {
        const deltaX = e.clientX - lastMouseXRef.current
        const rotationSpeed = 0.005
        modelRef.current.rotation.y += deltaX * rotationSpeed
        lastMouseXRef.current = e.clientX
      }
    }

    const handleMouseUp = () => {
      isRotatingRef.current = false
    }

    if (spacePressed) {
      window.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [spacePressed])

  const handleDoubleClick = (event: any) => {
    event.stopPropagation()

    if (event.intersections && event.intersections.length > 0) {
      const intersection = event.intersections[0]
      const position = intersection.point

      let worldNormal = new THREE.Vector3(0, 1, 0)
      if (intersection.face) {
        worldNormal.copy(intersection.face.normal)
        if (intersection.object) {
          worldNormal.transformDirection(intersection.object.matrixWorld)
        }
        worldNormal.normalize()
      }

      // Calcular tagPosition
      const toCamera = camera.position.clone().sub(position).normalize()
      const direction = worldNormal.clone().add(toCamera.multiplyScalar(0.5)).normalize()
      const distance = 0.5
      const tagPosition = position.clone().add(direction.multiplyScalar(distance))

      onModelClick(position, worldNormal, tagPosition)
    }
  }

  return (
    <group ref={modelRef} onDoubleClick={handleDoubleClick}>
      <primitive
        object={scene}
        scale={1}
        position={[0, -0.5, 0]}
        castShadow
        receiveShadow
      />
      {/* SECCIÓN DE EQUIPAMIENTO INTERIOR/EXTERIOR */}
      <Suspense fallback={null}>
        <ShelterEquipments />
      </Suspense>
    </group>
  )
}

function Lighting({ mode }: { mode: LightingMode }) {
  return (
    <>
      <ambientLight intensity={mode === 'studio' ? 0.4 : 0.2} />
      <directionalLight
        position={[5, 5, 3]}
        intensity={mode === 'studio' ? 0.8 : 1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="#ffaa44"
      />
      <directionalLight
        position={[-5, -5, -3]}
        intensity={mode === 'studio' ? 0.3 : 0.5}
        color="#88aaff"
      />
      {/* Luz de mina - simula linternas */}
      <pointLight position={[-3, 2, 0]} intensity={0.6} color="#ffaa44" distance={8} />
      <pointLight position={[3, 2, 0]} intensity={0.6} color="#ffaa44" distance={8} />
      {mode === 'dramatic' && (
        <pointLight position={[0, 3, -2]} intensity={0.4} color="#ff6b6b" />
      )}
      <spotLight
        position={[0, 5, 2]}
        angle={0.5}
        penumbra={1}
        intensity={mode === 'studio' ? 0.4 : 0.8}
        castShadow
        color="#ffaa44"
      />
    </>
  )
}

function Controls({ autoRotate, spacePressed }: { autoRotate: boolean, spacePressed: boolean }) {
  const { scene, camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (controlsRef.current && scene) {
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      controlsRef.current.target.copy(center)
      controlsRef.current.update()
    }
  }, [scene, camera])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate && !spacePressed
      controlsRef.current.autoRotateSpeed = 2.0
      // Desactivar controles cuando espacio está presionado
      controlsRef.current.enableRotate = !spacePressed
      controlsRef.current.enablePan = !spacePressed
      controlsRef.current.enableZoom = !spacePressed
    }
  }, [autoRotate, spacePressed])

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={!spacePressed}
      enablePan={!spacePressed}
      enableRotate={!spacePressed}
      minDistance={2}
      maxDistance={10}
      autoRotate={autoRotate && !spacePressed}
      autoRotateSpeed={2.0}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

function ScreenshotCapture({ onCapture }: { onCapture: () => void }) {
  const { gl } = useThree()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        onCapture()
      }
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [onCapture, gl])

  // Exponer gl para captura
  useEffect(() => {
    ; (window as any).__glRenderer = gl
  }, [gl])

  return null
}

export default function ModelViewer() {
  const [markers, setMarkers] = useState<Marker[]>([])
  const [materialType] = useState<MaterialType>('standard')
  const [lightingMode, setLightingMode] = useState<LightingMode>('studio')
  const [autoRotate, setAutoRotate] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentModel, setCurrentModel] = useState<string>(camaraModel)
  const [spacePressed, setSpacePressed] = useState(false)
  const [contactsExpanded, setContactsExpanded] = useState(false)

  // Detectar tecla espacio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const features = [
    'Balones de oxígeno',
    'Depurador CO2',
    'Agua y comida',
    'Detector de gas',
    'Aire acondicionado',
    'Iluminación manual y automática',
    'Baterías con autonomía de 3 a 5 días',
    'Ingreso para aire',
    'Cámara de seguridad',
    'Baño portátil',
    'Extintor'
  ]

  // Cargar marcadores desde markers.json al iniciar
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const response = await fetch('/markers.json')
        if (response.ok) {
          const markersData = await response.json()
          if (Array.isArray(markersData)) {
            setMarkers(markersData)
            console.log('Marcadores cargados desde markers.json:', markersData.length)
          }
        } else {
          console.log('No se encontró archivo markers.json, empezando con marcadores vacíos')
          setMarkers([])
        }
      } catch (error) {
        console.error('Error cargando marcadores desde markers.json:', error)
        setMarkers([])
      }
    }

    loadMarkers()
  }, [])

  useEffect(() => {
    // Simular carga del modelo
    const timer = setTimeout(() => {
      setLoading(false)
      // Calcular info del modelo
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleModelClick = (position: THREE.Vector3, normal: THREE.Vector3, tagPosition: THREE.Vector3) => {
    const text = prompt('Ingresa el texto para este marcador:') || 'Marcador'

    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      position: [position.x, position.y, position.z],
      text: text,
      normal: [normal.x, normal.y, normal.z],
      tagPosition: [tagPosition.x, tagPosition.y, tagPosition.z],
    }

    const updatedMarkers = [...markers, newMarker]
    setMarkers(updatedMarkers)

    // Mostrar JSON actualizado en consola para copiar a markers.json
    console.log('Marcadores actualizados:', updatedMarkers)
    console.log('JSON para markers.json:', JSON.stringify(updatedMarkers, null, 2))
    console.log('Nuevo marcador agregado:', newMarker)
  }

  const handleMarkerPositionUpdate = (
    id: string,
    newPosition: [number, number, number],
    newNormal: [number, number, number],
    tagPosition: [number, number, number]
  ) => {
    setMarkers(prevMarkers => {
      const updated = prevMarkers.map(marker =>
        marker.id === id
          ? { ...marker, position: newPosition, normal: newNormal, tagPosition: tagPosition }
          : marker
      )
      return updated
    })
  }


  const captureScreenshot = () => {
    const gl = (window as any).__glRenderer
    if (gl) {
      const canvas = gl.domElement
      const link = document.createElement('a')
      link.download = `screenshot-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen mine-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando modelo 3D...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen mine-background relative overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        }}
        onCreated={({ gl, scene }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          scene.background = null
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Lighting mode={lightingMode} />
        <Model
          onModelClick={handleModelClick}
          materialType={materialType}
          exploded={exploded}
          modelFile={currentModel}
          spacePressed={spacePressed}
        />
        {markers.map((marker) => (
          <MiningMarker
            key={marker.id}
            marker={marker}
            onPositionUpdate={handleMarkerPositionUpdate}
          />
        ))}
        <Controls autoRotate={autoRotate} spacePressed={spacePressed} />
        <Environment preset="warehouse" background={false} />
        <ScreenshotCapture onCapture={captureScreenshot} />
      </Canvas>

      {/* Título principal */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <h1 className="text-6xl font-bold mb-2" style={{ color: '#f12829' }}>
          SHELTER
        </h1>
        <p className="text-white/90 text-lg font-medium tracking-wide">
          Seguridad Minera Avanzada
        </p>
      </div>

      {/* Grid de Cards - Distribución equilibrada e innovadora */}

      {/* Columna Izquierda - Cards Informativos */}
      <div className="absolute top-32 left-4 flex flex-col gap-4">
        {/* Card de Mantenimiento */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Mantenimiento
          </h3>
          <div className="space-y-2 text-white/80 text-xs">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Revisión trimestral recomendada</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Limpieza de filtros mensual</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Verificación de baterías cada 6 meses</span>
            </div>
          </div>
        </div>

        {/* Card de Calibración */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Calibración
          </h3>
          <div className="space-y-2 text-white/80 text-xs">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sensores de gas calibrados</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sistema de monitoreo verificado</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Calibración anual certificada</span>
            </div>
          </div>
        </div>

        {/* Card de Certificaciones */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Certificaciones
          </h3>
          <div className="space-y-2 text-white/80 text-xs">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>ISO 9001:2015</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Normativa minera vigente</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Certificación de seguridad</span>
            </div>
          </div>
        </div>

        {/* Card de Estado del Sistema */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estado del Sistema
          </h3>
          <div className="space-y-2 text-white/80 text-xs">
            <div className="flex items-center justify-between">
              <span>Oxígeno</span>
              <span className="text-green-400 font-semibold">✓ Operativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Ventilación</span>
              <span className="text-green-400 font-semibold">✓ Operativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Iluminación</span>
              <span className="text-green-400 font-semibold">✓ Operativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Comunicación</span>
              <span className="text-green-400 font-semibold">✓ Operativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha - Cards Interactivos */}
      <div className="absolute top-32 right-4 flex flex-col gap-4">
        {/* Panel de Capacidad */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Capacidad
          </h3>
          <div className="space-y-2">
            {[8, 10, 12, 20].map((capacity) => (
              <div key={capacity} className="flex items-center gap-2 text-white/90 text-xs">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{capacity} personas</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Contactos */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 w-64 hover:scale-105">
          <button
            onClick={() => setContactsExpanded(!contactsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-white font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contactos
            </span>
            <span className={`transform transition-transform duration-300 ${contactsExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${contactsExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-4 pb-4 space-y-3">
              <a
                href="mailto:info@gunjop.com"
                className="flex items-center gap-2 text-white/90 text-xs hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@gunjop.com</span>
              </a>
              <a
                href="mailto:andre.jove@gunjop.com"
                className="flex items-center gap-2 text-white/90 text-xs hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>andre.jove@gunjop.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Card de Especificaciones */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl w-64 hover:scale-105 transition-transform duration-300">
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Especificaciones
          </h3>
          <p className="text-white/70 text-xs mb-3">
            Cámara de refugio minero con los siguientes componentes:
          </p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-white/90 text-xs">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel de control inferior */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${autoRotate
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
          >
            <span className="flex items-center gap-2">
              {autoRotate ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              Auto-rotación
            </span>
          </button>

          <button
            onClick={() => setExploded(!exploded)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${exploded
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
          >
            <span className="flex items-center gap-2">
              {exploded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {exploded ? 'Ensamblar' : 'Explosionar'}
            </span>
          </button>

          <button
            onClick={() => setLightingMode(lightingMode === 'studio' ? 'dramatic' : 'studio')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {lightingMode === 'studio' ? 'Modo Estudio' : 'Modo Dramático'}
            </span>
          </button>

          <button
            onClick={captureScreenshot}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capturar
            </span>
          </button>

          <button
            onClick={() => setCurrentModel(currentModel === camaraModel ? camaraAbiertoModel : camaraModel)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentModel === camaraAbiertoModel
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {currentModel === camaraAbiertoModel ? 'Cámara Cerrada' : 'Cámara Abierta'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
