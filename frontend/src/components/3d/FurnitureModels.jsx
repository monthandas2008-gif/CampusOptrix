import React from 'react';

/**
 * Realistic Student Classroom Desk
 * Position: Center of desk at (x, 0, z)
 * Tabletop is at y = 0.72m, facing -Z
 */
export function ClassroomDesk({ position = [0, 0, 0], width = 0.76, depth = 0.46, height = 0.72 }) {
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group position={position}>
      {/* 1. Tabletop Surface (Light Oak / Maple Wood-grain laminate) */}
      <mesh position={[0, height - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.035, depth]} />
        <meshStandardMaterial
          color="#FDE68A" // Warm Maple Woodgrain
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Front Modesty Panel (towards -Z / front of room) */}
      <mesh position={[0, height - 0.18, -halfD + 0.02]} castShadow>
        <boxGeometry args={[width * 0.92, 0.24, 0.02]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>

      {/* 3. 4 Tubular Metal Desk Legs (grounded at y = 0) */}
      <mesh position={[-halfW + 0.05, (height - 0.04) / 2, -halfD + 0.05]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, height - 0.04, 6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[halfW - 0.05, (height - 0.04) / 2, -halfD + 0.05]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, height - 0.04, 6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[-halfW + 0.05, (height - 0.04) / 2, halfD - 0.05]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, height - 0.04, 6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[halfW - 0.05, (height - 0.04) / 2, halfD - 0.05]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, height - 0.04, 6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Realistic Ergonomic Student Chair
 * Facing direction: -Z (towards the desk and front screen)
 * Backrest is at +Z (the rear)
 * Seat height: y = 0.44m
 * isEmpty: If true, renders an illuminated soft-green floor tile ring for instant capacity recognition
 */
export function ErgonomicChair({ position = [0, 0, 0], rotation = 0, seatHeight = 0.44, isEmpty = false }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 1. Empty Seat Floor Highlight Ring (Visually obvious soft green capacity indicator) */}
      {isEmpty && (
        <group position={[0, 0.005, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.26, 0.36, 24]} />
            <meshStandardMaterial
              color="#22C55E" // Soft Emerald Green
              emissive="#22C55E"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.26, 24]} />
            <meshStandardMaterial
              color="#DCFCE7"
              emissive="#86EFAC"
              emissiveIntensity={0.2}
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      )}

      {/* 2. Molded Seat Pad (at y = 0.44m) */}
      <mesh position={[0, seatHeight - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.04, 0.38]} />
        <meshStandardMaterial
          color={isEmpty ? '#334155' : '#334155'}
          emissive={isEmpty ? '#15803D' : '#000000'}
          emissiveIntensity={isEmpty ? 0.25 : 0}
          roughness={0.4}
        />
      </mesh>

      {/* 3. Curved Lumbar Backrest (at +Z / rear of chair) */}
      <mesh position={[0, seatHeight + 0.24, 0.16]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.38, 0.26, 0.03]} />
        <meshStandardMaterial
          color="#334155"
          emissive={isEmpty ? '#15803D' : '#000000'}
          emissiveIntensity={isEmpty ? 0.25 : 0}
          roughness={0.4}
        />
      </mesh>

      {/* 4. Backrest Support Struts */}
      <mesh position={[0, seatHeight + 0.11, 0.14]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.22, 6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 5. 4 Metal Tubular Chair Legs (grounded at y = 0) */}
      <mesh position={[-0.16, seatHeight / 2 - 0.02, -0.14]} rotation={[0.08, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, seatHeight - 0.02, 6]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.16, seatHeight / 2 - 0.02, -0.14]} rotation={[0.08, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, seatHeight - 0.02, 6]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[-0.16, seatHeight / 2 - 0.02, 0.14]} rotation={[-0.08, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, seatHeight - 0.02, 6]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.16, seatHeight / 2 - 0.02, 0.14]} rotation={[-0.08, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, seatHeight - 0.02, 6]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

// Low-Poly Potted Indoor Plant Prop
export function PottedPlant({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Ceramic Planter Pot */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.5, 10]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 10]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Foliage Clusters */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#15803D" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.88, 0.08]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#16A34A" roughness={0.7} />
      </mesh>
      <mesh position={[-0.1, 0.85, -0.08]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#22C55E" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Wall Clock Prop
export function WallClock({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.03, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.01, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Center Pin */}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#E11D48" />
      </mesh>
    </group>
  );
}
