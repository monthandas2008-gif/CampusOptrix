import React, { useMemo } from 'react';
import SeatInstancer from '../SeatInstancer';
import RoomShell from '../RoomShell';

export default function ScienceLabTemplate({
  capacity = 25,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomName = 'Science Lab'
}) {
  const { seatPositions, seatRotations, islandPositions, dimensions } = useMemo(() => {
    const islandsCount = Math.max(2, Math.ceil(capacity / 6));
    const width = 11.5;
    const length = 11.5;

    const islands = [];
    const seats = [];
    const rotations = [];

    const numRows = Math.ceil(islandsCount / 2);
    const spacingX = 4.0;
    const spacingZ = 3.6;

    const startX = -2.0;
    const startZ = -length / 2 + 3.0;

    let seatCount = 0;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < 2; c++) {
        if (islands.length < islandsCount) {
          const ix = startX + c * spacingX;
          const iz = startZ + r * spacingZ;
          islands.push([ix, 0.45, iz]);

          // 3 seats on the front side (facing bench towards -Z), 3 seats on back side (facing bench towards +Z)
          const seatOffsets = [
            // South side of bench (facing bench north towards -Z: rot = 0)
            { off: [-0.8, 0.7], rot: 0 },
            { off: [0, 0.7], rot: 0 },
            { off: [0.8, 0.7], rot: 0 },
            // North side of bench (facing bench south towards +Z: rot = Math.PI)
            { off: [-0.8, -0.7], rot: Math.PI },
            { off: [0, -0.7], rot: Math.PI },
            { off: [0.8, -0.7], rot: Math.PI }
          ];

          for (const s of seatOffsets) {
            if (seatCount < capacity) {
              seats.push([ix + s.off[0], 0, iz + s.off[1]]);
              rotations.push(s.rot);
              seatCount++;
            }
          }
        }
      }
    }

    return {
      seatPositions: seats,
      seatRotations: rotations,
      islandPositions: islands,
      dimensions: { width, length, height: 3.6 }
    };
  }, [capacity]);

  const utilRatio = capacity > 0 ? studentsCurrent / capacity : 0;
  const isOvercap = studentsCurrent > capacity;

  return (
    <group>
      <RoomShell
        width={dimensions.width}
        length={dimensions.length}
        height={dimensions.height}
        roomName={roomName}
        roomType="science_lab"
        utilRatio={utilRatio}
        isOvercap={isOvercap}
      />

      {/* Fume Hood Enclosure on Side Wall */}
      <group position={[-dimensions.width / 2 + 0.8, 1.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 2.4, 2.0]} />
          <meshStandardMaterial
            color="#E2E8F0"
            emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#000000'}
            emissiveIntensity={viewMode === 'EQUIPMENT' ? 0.6 : 0}
          />
        </mesh>
        {/* Glass Sash */}
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[0.08, 1.4, 1.8]} />
          <meshStandardMaterial color="#94A3B8" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Island Lab Benches with Sink Props */}
      {islandPositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Main Lab Bench Tabletop (Epoxy Resin Black/Dark Slate) */}
          <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.08, 1.2]} />
            <meshStandardMaterial color="#1E293B" roughness={0.2} />
          </mesh>
          {/* Cabinet Base */}
          <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.72, 1.0]} />
            <meshStandardMaterial color="#F1F5F9" roughness={0.5} />
          </mesh>
          {/* Sink Basin Center Prop */}
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.4, 0.08, 0.4]} />
            <meshStandardMaterial
              color="#64748B"
              emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#000000'}
              emissiveIntensity={viewMode === 'EQUIPMENT' ? 0.5 : 0}
            />
          </mesh>
        </group>
      ))}

      {/* Instanced Lab Stools & Real Seated Human Avatars */}
      <SeatInstancer
        seatPositions={seatPositions}
        seatRotations={seatRotations}
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomType="science_lab"
        dimensions={dimensions}
      />
    </group>
  );
}
