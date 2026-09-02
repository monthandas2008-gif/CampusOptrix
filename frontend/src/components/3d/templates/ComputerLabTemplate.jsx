import React, { useMemo } from 'react';
import SeatInstancer from '../SeatInstancer';
import RoomShell from '../RoomShell';

export default function ComputerLabTemplate({
  capacity = 30,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomName = 'Computer Lab'
}) {
  const { seatPositions, workstationPositions, dimensions } = useMemo(() => {
    const colsPerBlock = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(capacity) / 2)));
    const totalCols = colsPerBlock * 2;
    const rows = Math.ceil(capacity / totalCols);

    const spacingX = 1.05;
    const spacingZ = 1.45;
    const centerAisle = 1.4;

    const width = Math.max(9.2, totalCols * spacingX + centerAisle + 2.6);
    const length = Math.max(9.5, rows * spacingZ + 4.6);

    const seats = [];
    const workstations = [];

    const startZ = -length / 2 + 3.2;

    for (let r = 0; r < rows; r++) {
      const z = startZ + r * spacingZ;

      // Left Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = -(centerAisle / 2) - (colsPerBlock - 1 - c) * spacingX - spacingX / 2;
          seats.push([x, 0, z]);
          workstations.push([x, 0, z - 0.44]);
        }
      }

      // Right Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = (centerAisle / 2) + c * spacingX + spacingX / 2;
          seats.push([x, 0, z]);
          workstations.push([x, 0, z - 0.44]);
        }
      }
    }

    return {
      seatPositions: seats,
      workstationPositions: workstations,
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
        roomType="computer_lab"
        utilRatio={utilRatio}
        isOvercap={isOvercap}
      />

      {/* Instructor Server Station at Front */}
      <group position={[0, 0, -dimensions.length / 2 + 1.5]}>
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.72, 0.8]} />
          <meshStandardMaterial color="#1E293B" roughness={0.3} />
        </mesh>
        {/* Main Console Monitor (facing rear +Z towards students) */}
        <mesh position={[0, 0.94, 0]} castShadow>
          <boxGeometry args={[0.7, 0.45, 0.05]} />
          <meshStandardMaterial
            color="#0F172A"
            emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#0284C7'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Student Workstation Desks with Monitor Props */}
      {workstationPositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Desk Bench (surface at y = 0.72) */}
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.88, 0.72, 0.48]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </mesh>
          {/* Tabletop */}
          <mesh position={[0, 0.73, 0]}>
            <boxGeometry args={[0.92, 0.035, 0.5]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.2} />
          </mesh>
          {/* Monitor Screen (placed at front of desk, facing student towards +Z) */}
          <mesh position={[0, 0.95, -0.1]} castShadow>
            <boxGeometry args={[0.46, 0.3, 0.03]} />
            <meshStandardMaterial
              color="#0F172A"
              emissive={viewMode === 'EQUIPMENT' ? '#2F9C95' : '#0284C7'}
              emissiveIntensity={viewMode === 'EQUIPMENT' ? 0.9 : 0.4}
            />
          </mesh>
          {/* Monitor Stand */}
          <mesh position={[0, 0.78, -0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
          {/* Keyboard (near student at +Z edge of desk) */}
          <mesh position={[0, 0.75, 0.08]}>
            <boxGeometry args={[0.3, 0.015, 0.12]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      ))}

      {/* Instanced Seats & Real Seated Human Avatars */}
      <SeatInstancer
        seatPositions={seatPositions}
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomType="computer_lab"
        dimensions={dimensions}
      />
    </group>
  );
}
