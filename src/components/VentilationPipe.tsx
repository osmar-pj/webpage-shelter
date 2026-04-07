/**
 * Sistema de Filtración y Regulación de Aire (Cámara Minera).
 * Incluye válvula de bola, regulador de presión azul y silenciador gris.
 */
export default function VentilationPipe({
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
      
      {/* ── 1. TUBERÍA DE ENTRADA Y VÁLVULA DE BOLA ── */}
      <group position={[0.001, 0.02, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Tubería principal */}
        <mesh castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 16]} />
          <meshStandardMaterial color="#b0a898" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Cuerpo de la válvula de bola */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#c0b8a8" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Manija de la válvula (Azul) */}
        <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <boxGeometry args={[0.008, 0.06, 0.004]} />
          <meshStandardMaterial color="#0056b3" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ── 2. CUERPO CENTRAL (Bloque de Regulación) ── */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
        <meshStandardMaterial color="#f0f0e8" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Perilla del Regulador Superior (Azul) */}
      <group position={[0, 0.06, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.035, 12]} />
          <meshStandardMaterial color="#007bff" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Detalle de estrías en la perilla */}
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.019, 0.019, 0.005, 12]} />
          <meshStandardMaterial color="#0056b3" />
        </mesh>
      </group>

      {/* ── 3. SALIDA / SILENCIADOR (Tubo Gris Inclinado) ── */}
      <group position={[0.001, 0.02, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Cuello de conexión */}
        <mesh castShadow>
          <cylinderGeometry args={[0.008, 0.01, 0.02, 12]} />
          <meshStandardMaterial color="#b8b0a0" metalness={0.85} roughness={0.15} />
        </mesh>

        {/* Cuerpo del Silenciador (Gris Metálico) */}
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.07, 24]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Tapa superior del silenciador */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.006, 24]} />
          <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* ── SOPORTE / BRACKET TRASERO ── */}
      <mesh position={[0, 0.02, -0.025]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.005]} />
        <meshStandardMaterial color="#a0a090" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}