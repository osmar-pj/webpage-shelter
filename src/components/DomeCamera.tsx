/**
 * Cámara domo de seguridad (tipo empotrada en pared/techo).
 * Cuerpo blanco con domo semitransparente y LEDs interiores.
 */
export default function DomeCamera({
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base de montaje (plato blanco pegado a la pared) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.075, 0.02, 24]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Anillo decorativo */}
      <mesh position={[0, 0.01, 0]}>
        <torusGeometry args={[0.068, 0.004, 6, 24]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Cuerpo cilíndrico bajo */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.03, 24]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Domo semitransparente */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.055, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Lente interior (visible a través del domo) */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.015, 12]} />
        <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshPhysicalMaterial
          color="#0a0a2a"
          roughness={0.05}
          metalness={0.8}
          clearcoat={1}
        />
      </mesh>

      {/* LEDs IR (puntos alrededor de la lente) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        const r = 0.03
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.048, Math.sin(a) * r]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshStandardMaterial
              color="#ff2200"
              emissive="#ff2200"
              emissiveIntensity={0.5}
            />
          </mesh>
        )
      })}

      {/* Cable de conexión (sale por detrás) */}
      <mesh position={[0, -0.005, -0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </mesh>
    </group>
  )
}
