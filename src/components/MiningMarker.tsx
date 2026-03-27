import { useMemo, useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Marker } from './ModelViewer'

interface MiningMarkerProps {
  marker: Marker
  onPositionUpdate?: (id: string, newPosition: [number, number, number], newNormal: [number, number, number], tagPosition: [number, number, number]) => void
}

export default function MiningMarker({ marker, onPositionUpdate }: MiningMarkerProps) {
  const { camera, raycaster, pointer, gl } = useThree()
  const tagGroupRef = useRef<THREE.Group>(null)
  const isDraggingRef = useRef(false)
  const dragPlaneRef = useRef<THREE.Plane | null>(null)

  // Colores industriales de mina
  const MINE_ORANGE = "#ff6b00"  // Naranja de seguridad
  const MINE_DARK = "#1a1a1a"    // Carbón / Metal oscuro
  const MINE_YELLOW = "#ffcc00"  // Amarillo de precaución

  // Calcular punto flotante: usar tagPosition si existe, sino calcularlo
  const floatingPoint = useMemo(() => {
    if (marker.tagPosition) {
      return new THREE.Vector3(...marker.tagPosition)
    }
    
    const surfacePoint = new THREE.Vector3(...marker.position)
    const normal = new THREE.Vector3(...marker.normal)
    const toCamera = camera.position.clone().sub(surfacePoint).normalize()
    const direction = normal.clone().add(toCamera.multiplyScalar(0.5)).normalize()
    const distance = 0.5
    
    return surfacePoint.clone().add(direction.multiplyScalar(distance))
  }, [marker.position, marker.normal, marker.tagPosition, camera.position])

  // Lógica de rotación y actualización de posición durante arrastre
  useFrame(() => {
    if (tagGroupRef.current) {
      if (!isDraggingRef.current) {
        tagGroupRef.current.lookAt(camera.position)
      } else {
        raycaster.setFromCamera(pointer, camera)
        if (dragPlaneRef.current) {
          const intersection = new THREE.Vector3()
          raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)
          if (intersection) {
            tagGroupRef.current.position.copy(intersection)
            
            const toCamera = camera.position.clone().sub(intersection).normalize()
            const normal = new THREE.Vector3(...marker.normal)
            const direction = normal.clone().add(toCamera.multiplyScalar(0.5)).normalize()
            const newSurfacePoint = intersection.clone().sub(direction.multiplyScalar(0.5))
            const newNormal = direction.normalize()
            
            if (onPositionUpdate) {
              onPositionUpdate(
                marker.id,
                [newSurfacePoint.x, newSurfacePoint.y, newSurfacePoint.z],
                [newNormal.x, newNormal.y, newNormal.z],
                [intersection.x, intersection.y, intersection.z]
              )
            }
          }
        }
      }
    }
  })

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    isDraggingRef.current = true
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    const planePoint = tagGroupRef.current?.position.clone() || floatingPoint.clone()
    dragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDirection, planePoint)
    if (gl.domElement) gl.domElement.style.cursor = 'grabbing'
  }

  const handlePointerUp = () => {
    if (isDraggingRef.current && tagGroupRef.current) {
      isDraggingRef.current = false
      if (gl.domElement) gl.domElement.style.cursor = 'default'
      
      const finalPosition = tagGroupRef.current.position.clone()
      const toCamera = camera.position.clone().sub(finalPosition).normalize()
      const normal = new THREE.Vector3(...marker.normal)
      const direction = normal.clone().add(toCamera.multiplyScalar(0.5)).normalize()
      const newSurfacePoint = finalPosition.clone().sub(direction.multiplyScalar(0.5))
      const newNormal = direction.normalize()
      
      if (onPositionUpdate) {
        onPositionUpdate(
          marker.id,
          [newSurfacePoint.x, newSurfacePoint.y, newSurfacePoint.z],
          [newNormal.x, newNormal.y, newNormal.z],
          [finalPosition.x, finalPosition.y, finalPosition.z]
        )
      }
    }
  }

  useEffect(() => {
    const mu = () => handlePointerUp()
    window.addEventListener('mouseup', mu)
    return () => window.removeEventListener('mouseup', mu)
  }, [])

  return (
    <group>
      {/* 1. Punto en la Superficie - "Sensor de Mina" */}
      <group position={marker.position}>
        {/* Base hexagonal industrial */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.01, 6]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Núcleo brillante */}
        <mesh>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshStandardMaterial 
            color={MINE_ORANGE} 
            emissive={MINE_ORANGE} 
            emissiveIntensity={2} 
          />
        </mesh>
        {/* Halo de luz sutil */}
        <pointLight color={MINE_ORANGE} intensity={0.2} distance={0.5} />
      </group>

      {/* 2. Línea Conectora - "Cable de Señal Blindado" */}
      <Line
        points={[floatingPoint, new THREE.Vector3(...marker.position)]}
        color={MINE_YELLOW}
        lineWidth={2}
        transparent
        opacity={0.8}
        dashed={true}
        dashScale={50}
        dashSize={0.05}
        gapSize={0.05}
      />

      {/* 3. Tag Flotante - "Terminal de Monitoreo" */}
      <group 
        ref={tagGroupRef} 
        position={[floatingPoint.x, floatingPoint.y, floatingPoint.z]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Marco Metálico Exterior (Bezel) */}
        <mesh>
          <planeGeometry args={[0.54, 0.24]} />
          <meshStandardMaterial color="#000" metalness={1} roughness={0.1} />
        </mesh>

        {/* Pantalla / Fondo (Frosted Glass Dark) */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.5, 0.2]} />
          <meshStandardMaterial 
            color={MINE_DARK} 
            opacity={0.85} 
            transparent 
            roughness={0}
            metalness={0.5}
          />
        </mesh>

        {/* Bordes de seguridad (Esquineras Naranjas) */}
        {/* Top-Left */}
        <mesh position={[-0.25, 0.1, 0.01]}>
          <planeGeometry args={[0.04, 0.01]} />
          <meshBasicMaterial color={MINE_ORANGE} />
        </mesh>
        <mesh position={[-0.265, 0.085, 0.01]}>
          <planeGeometry args={[0.01, 0.04]} />
          <meshBasicMaterial color={MINE_ORANGE} />
        </mesh>

        {/* Bottom-Right */}
        <mesh position={[0.25, -0.1, 0.01]}>
          <planeGeometry args={[0.04, 0.01]} />
          <meshBasicMaterial color={MINE_ORANGE} />
        </mesh>
        <mesh position={[0.265, -0.085, 0.01]}>
          <planeGeometry args={[0.01, 0.04]} />
          <meshBasicMaterial color={MINE_ORANGE} />
        </mesh>

        {/* Barra Superior Detalle ID */}
        <mesh position={[0, 0.08, 0.01]}>
          <planeGeometry args={[0.4, 0.015]} />
          <meshBasicMaterial color="#333" />
        </mesh>
        <Text
          position={[0, 0.08, 0.015]}
          fontSize={0.015}
          color={MINE_YELLOW}
        >
          REFUGIO-SEC-{(marker.id.split('-')[1] || "000").substring(0,4)}
        </Text>

        {/* Texto del Marcador */}
        <Text
          position={[0, -0.01, 0.02]}
          fontSize={0.045}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          maxWidth={0.45}
        >
          {marker.text.toUpperCase()}
        </Text>

        {/* Indicador de Estado (Dot verde) */}
        <mesh position={[-0.2, -0.07, 0.02]}>
          <circleGeometry args={[0.01, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        <Text
          position={[-0.08, -0.07, 0.02]}
          fontSize={0.02}
          color="#00ff00"
          anchorX="left"
        >
          OPERATIVO
        </Text>
      </group>
    </group>
  )
}
