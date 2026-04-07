/**
 * Manifold de gas con 3 acoples rápidos (CO, O2, CO2).
 * Barra horizontal metálica con 3 conectores tipo quick-connect
 * colgando hacia abajo, con etiquetas.
 */
export default function GasManifold({
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const labels = ['CO', 'O2', 'CO2']

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* ── BARRA HORIZONTAL (manifold) ── */}
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.025, 0.04]} />
        <meshStandardMaterial color="#c0b8a8" metalness={0.75} roughness={0.2} />
      </mesh>

      {/* Etiquetas superiores (plaquitas blancas) */}
      <mesh position={[0, 0.014, 0.005]}>
        <boxGeometry args={[0.2, 0.008, 0.001]} />
        <meshStandardMaterial color="#f0f0e8" roughness={0.7} />
      </mesh>

      {/* ── 3 ACOPLES RÁPIDOS ── */}
      {labels.map((label, i) => {
        const x = (i - 1) * 0.07
        return (
          <group key={label} position={[x, -0.0125, 0]}>
            {/* Base / fitting hexagonal (conecta al manifold) */}
            <mesh castShadow>
              <cylinderGeometry args={[0.014, 0.016, 0.015, 6]} />
              <meshStandardMaterial color="#b0a898" metalness={0.8} roughness={0.18} />
            </mesh>

            {/* Cuello roscado */}
            <mesh position={[0, -0.014, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.014, 0.016, 12]} />
              <meshStandardMaterial color="#b8b0a0" metalness={0.85} roughness={0.15} />
            </mesh>

            {/* Cuerpo del acople rápido (parte más ancha) */}
            <mesh position={[0, -0.03, 0]} castShadow>
              <cylinderGeometry args={[0.016, 0.014, 0.02, 14]} />
              <meshStandardMaterial color="#b0a898" metalness={0.82} roughness={0.18} />
            </mesh>

            {/* Anillo de retención */}
            <mesh position={[0, -0.022, 0]}>
              <torusGeometry args={[0.015, 0.003, 6, 14]} />
              <meshStandardMaterial color="#a09888" metalness={0.85} roughness={0.15} />
            </mesh>

            {/* Punta inferior (salida) */}
            <mesh position={[0, -0.045, 0]} castShadow>
              <cylinderGeometry args={[0.01, 0.012, 0.012, 10]} />
              <meshStandardMaterial color="#b8b0a0" metalness={0.85} roughness={0.15} />
            </mesh>

            {/* Borde inferior */}
            <mesh position={[0, -0.052, 0]}>
              <torusGeometry args={[0.011, 0.002, 6, 12]} />
              <meshStandardMaterial color="#a09080" metalness={0.85} roughness={0.15} />
            </mesh>
          </group>
        )
      })}

      {/* ── SOPORTE SUPERIOR (bracket al detector de gas) ── */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <boxGeometry args={[0.12, 0.012, 0.035]} />
        <meshStandardMaterial color="#b8b0a0" metalness={0.75} roughness={0.2} />
      </mesh>
    </group>
  )
}
