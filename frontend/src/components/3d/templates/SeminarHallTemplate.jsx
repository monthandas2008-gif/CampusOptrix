import React, { useMemo } from 'react';
import SeatInstancer from '../SeatInstancer';
import RoomShell from '../RoomShell';

export default function SeminarHallTemplate({
  capacity = 60,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomName = 'Seminar Hall'
}) {
  const { seatPositions, seatRotations, dimensions } = useMemo(() => {
    const rows = 4;
    const seatsPerRow = Math.ceil(capacity / rows);

    const width = 14;
    const length = 13;
    const stageZ = -length / 2 + 1.8;

    const seats = [];
    const rotations = [];
    const baseRadius = 4.2;
    const rowSpacing = 1.45;

    for (let r = 0; r < rows; r++) {
      const radius = baseRadius + r * rowSpacing;
      const count = Math.min(seatsPerRow + r * 2, capacity - seats.length);
      const angleSpan = Math.PI * 0.52; // Arc
      const startAngle = -angleSpan / 2;

      for (let i = 0; i < count; i++) {
        const angle = startAngle + (i / Math.max(1, count - 1)) * angleSpan;
        const x = Math.sin(angle) * radius;
        const z = stageZ + Math.cos(angle) * radius + 0.6;

        seats.push([x, 0, z]);

        // Angle pointing toward the stage center (0, 0, stageZ)
        const angleTowardStage = Math.atan2(0 - x, stageZ - z) - Math.PI;
        rotations.push(angleTowardStage);
      }
    }

    return {
      seatPositions: seats,
      seatRotations: rotations,
      dimensions: { width, length, height: 4.0 }
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
        roomType="seminar_hall"
        utilRatio={utilRatio}
        isOvercap={isOvercap}
      />

      {/* Raised Stage Platform at Front */}
      <group position={[0, 0, -dimensions.length / 2 + 1.8]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[dimensions.width * 0.75, 0.4, 2.4]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
        {/* Presentation Podium */}
        <mesh position={[-1.6, 0.9, 0.2]} castShadow>
          <boxGeometry args={[0.7, 1.1, 0.5]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        {/* Giant Curved/Wide Projection Screen */}
        <mesh position={[0, 2.2, -1.0]}>
          <boxGeometry args={[6.5, 2.2, 0.05]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#FFFFFF'}
            emissiveIntensity={viewMode === 'EQUIPMENT' ? 0.6 : 0.15}
          />
        </mesh>
      </group>

      {/* Instanced Seminar Chairs & Real Seated Human Avatars */}
      <SeatInstancer
        seatPositions={seatPositions}
        seatRotations={seatRotations}
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomType="seminar_hall"
        dimensions={dimensions}
      />
    </group>
  );
}
