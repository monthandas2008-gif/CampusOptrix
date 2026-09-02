import React, { useMemo } from 'react';
import SeatInstancer from '../SeatInstancer';
import RoomShell from '../RoomShell';

export default function LectureHallTemplate({
  capacity = 80,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomName = 'Lecture Hall'
}) {
  const { seatPositions, deskPositions, tierPlatforms, dimensions } = useMemo(() => {
    const colsPerBlock = Math.min(4, Math.max(3, Math.ceil(Math.sqrt(capacity * 1.2) / 2)));
    const totalCols = colsPerBlock * 2;
    const rows = Math.ceil(capacity / totalCols);

    const spacingX = 1.0;
    const spacingZ = 1.45;
    const stepY = 0.28;
    const centerAisle = 1.4;

    const width = Math.max(12, totalCols * spacingX + centerAisle + 3.0);
    const length = Math.max(12, rows * spacingZ + 5.2);

    const startZ = -length / 2 + 3.6;

    const seats = [];
    const desks = [];
    const platforms = [];

    for (let r = 0; r < rows; r++) {
      const currentY = r * stepY;
      const z = startZ + r * spacingZ;

      // Tier Platform Box
      platforms.push({
        position: [0, currentY / 2, z],
        size: [width * 0.92, Math.max(0.04, currentY), spacingZ * 1.02]
      });

      // Left Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = -(centerAisle / 2) - (colsPerBlock - 1 - c) * spacingX - spacingX / 2;
          seats.push([x, currentY, z]);
          desks.push([x, currentY, z - 0.44]);
        }
      }

      // Right Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = (centerAisle / 2) + c * spacingX + spacingX / 2;
          seats.push([x, currentY, z]);
          desks.push([x, currentY, z - 0.44]);
        }
      }
    }

    return {
      seatPositions: seats,
      deskPositions: desks,
      tierPlatforms: platforms,
      dimensions: { width, length, height: 4.6 }
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
        roomType="lecture_hall"
        utilRatio={utilRatio}
        isOvercap={isOvercap}
      />

      {/* Tiered Tier Steps */}
      {tierPlatforms.map((tier, idx) => (
        <mesh key={idx} position={tier.position} receiveShadow>
          <boxGeometry args={tier.size} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
        </mesh>
      ))}

      {/* Auditorium Continuous Desk Benches on each Tier */}
      {deskPositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh position={[0, 0.72 - 0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.94, 0.035, 0.38]} />
            <meshStandardMaterial color="#FDE68A" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.36, -0.16]} castShadow>
            <boxGeometry args={[0.92, 0.68, 0.02]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Lecture Stage & Large Podium at Front */}
      <group position={[0, 0, -dimensions.length / 2 + 1.6]}>
        {/* Stage */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[dimensions.width * 0.8, 0.3, 2.4]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.4} />
        </mesh>
        {/* Modern Lecture Podium */}
        <mesh position={[-2.2, 0.85, 0.2]} castShadow>
          <boxGeometry args={[0.8, 1.1, 0.5]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        {/* Giant Main Auditorium Widescreen */}
        <mesh position={[0, 2.4, -1.1]}>
          <boxGeometry args={[7.5, 2.6, 0.05]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#FFFFFF'}
            emissiveIntensity={viewMode === 'EQUIPMENT' ? 0.6 : 0.15}
          />
        </mesh>
      </group>

      {/* Instanced Raked Seats & Real Seated Human Avatars */}
      <SeatInstancer
        seatPositions={seatPositions}
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomType="lecture_hall"
        dimensions={dimensions}
      />
    </group>
  );
}
