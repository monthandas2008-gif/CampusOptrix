import React, { useMemo } from 'react';
import { PottedPlant, WallClock } from './FurnitureModels';

export default function RoomShell({
  width = 10,
  length = 12,
  height = 3.6,
  roomName = 'Room',
  roomType = 'classroom',
  utilRatio = 0,
  isOvercap = false
}) {
  const halfW = width / 2;
  const halfL = length / 2;

  // Status ring color for subtle perimeter accent
  const statusColor = useMemo(() => {
    if (isOvercap) return '#E03131'; // Coral / Red
    if (utilRatio <= 0.3 && utilRatio > 0) return '#D5A13A'; // Amber
    if (utilRatio > 0) return '#45A970'; // Green
    return '#CBD5E1'; // Neutral
  }, [utilRatio, isOvercap]);

  const isLab = roomType.includes('lab');

  return (
    <group>
      {/* 1. Floor Plane with Realistic Architectural Material */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color={isLab ? '#334155' : '#FEF3C7'} // Slate epoxy for lab, warm oak laminate for classroom
          roughness={isLab ? 0.3 : 0.55}
          metalness={0.08}
        />
      </mesh>

      {/* 2. Floor Grid Overlay */}
      <gridHelper
        args={[Math.max(width, length), Math.max(width, length), '#CBD5E1', '#E2E8F0']}
        position={[0, 0.001, 0]}
      />

      {/* 3. Subtle Status Perimeter Accent Ring on Floor Edge */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(width, length) * 0.46, Math.min(width, length) * 0.48, 32]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* 4. Front Presentation Wall (Board Wall) */}
      <mesh position={[0, height / 2, -halfL]} receiveShadow>
        <boxGeometry args={[width, height, 0.12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
      </mesh>

      {/* 5. Main Whiteboard / Projection Screen Surface with Faint Emissive Glow */}
      <group position={[0, 1.85, -halfL + 0.08]}>
        {/* Frame */}
        <mesh receiveShadow>
          <boxGeometry args={[Math.min(width * 0.65, 5.4), 1.7, 0.04]} />
          <meshStandardMaterial color="#475569" roughness={0.3} />
        </mesh>
        {/* Whiteboard Surface */}
        <mesh position={[0, 0, 0.02]} receiveShadow>
          <boxGeometry args={[Math.min(width * 0.65, 5.2), 1.55, 0.02]} />
          <meshStandardMaterial
            color="#F8FAFC"
            roughness={0.2}
            emissive="#FFFFFF"
            emissiveIntensity={0.12}
          />
        </mesh>
      </group>

      {/* 6. Left Wall with Daylight Window Cutouts */}
      <mesh position={[-halfW, 1.0, 0]} receiveShadow>
        <boxGeometry args={[0.12, 2.0, length]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.7} />
      </mesh>

      {/* Window Daylight Glow Planes */}
      <mesh position={[-halfW + 0.08, 1.8, -1.2]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshStandardMaterial
          color="#BAE6FD"
          emissive="#38BDF8"
          emissiveIntensity={0.5}
          side={2}
        />
      </mesh>
      <mesh position={[-halfW + 0.08, 1.8, 1.8]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshStandardMaterial
          color="#BAE6FD"
          emissive="#38BDF8"
          emissiveIntensity={0.5}
          side={2}
        />
      </mesh>

      {/* 7. Right Wall (Half-height architectural cutaway) */}
      <mesh position={[halfW, 1.0, 0]} receiveShadow>
        <boxGeometry args={[0.12, 2.0, length]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.7} />
      </mesh>

      {/* 8. Suspended Rectangular LED Ceiling Panel Lights (~4000K Warm White) */}
      <group position={[0, height - 0.2, 0]}>
        {/* Front-left Light */}
        <mesh position={[-width * 0.25, 0, -length * 0.22]}>
          <boxGeometry args={[1.6, 0.04, 0.6]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFBEB"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Front-right Light */}
        <mesh position={[width * 0.25, 0, -length * 0.22]}>
          <boxGeometry args={[1.6, 0.04, 0.6]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFBEB"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Back-left Light */}
        <mesh position={[-width * 0.25, 0, length * 0.22]}>
          <boxGeometry args={[1.6, 0.04, 0.6]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFBEB"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Back-right Light */}
        <mesh position={[width * 0.25, 0, length * 0.22]}>
          <boxGeometry args={[1.6, 0.04, 0.6]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFBEB"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* 9. Ceiling Projector Prop */}
      <group position={[0, height - 0.5, -halfL + length * 0.36]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshStandardMaterial color="#64748B" />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.38, 0.16, 0.32]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
      </group>

      {/* 10. Wall Clock Prop on Front Wall */}
      <WallClock position={[Math.min(width * 0.38, 3.2), 2.8, -halfL + 0.08]} />

      {/* 11. Potted Plants in Corners for Warmth */}
      <PottedPlant position={[-halfW + 0.7, 0, -halfL + 0.8]} />
      <PottedPlant position={[halfW - 0.7, 0, -halfL + 0.8]} />
    </group>
  );
}
