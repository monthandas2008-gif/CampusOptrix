import React, { useMemo } from 'react';
import SeatInstancer from '../SeatInstancer';
import RoomShell from '../RoomShell';
import { ClassroomDesk } from '../FurnitureModels';

export default function ClassroomTemplate({
  capacity = 40,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomName = 'Classroom'
}) {
  const { seatPositions, deskPositions, dimensions } = useMemo(() => {
    // 2 blocks (Left & Right) with a central walking aisle
    const colsPerBlock = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(capacity) / 2)));
    const totalCols = colsPerBlock * 2;
    const rows = Math.ceil(capacity / totalCols);

    const spacingX = 0.95;
    const spacingZ = 1.35;
    const centerAisle = 1.2;

    const width = Math.max(9.0, totalCols * spacingX + centerAisle + 2.4);
    const length = Math.max(9.5, rows * spacingZ + 4.6);

    const seats = [];
    const desks = [];

    const startZ = -length / 2 + 3.2; // Clean clearance from teacher desk

    for (let r = 0; r < rows; r++) {
      const z = startZ + r * spacingZ;

      // Left Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = -(centerAisle / 2) - (colsPerBlock - 1 - c) * spacingX - spacingX / 2;
          seats.push([x, 0, z]);
          desks.push([x, 0, z - 0.44]); // Desk is in front of the chair (towards -Z)
        }
      }

      // Right Block
      for (let c = 0; c < colsPerBlock; c++) {
        if (seats.length < capacity) {
          const x = (centerAisle / 2) + c * spacingX + spacingX / 2;
          seats.push([x, 0, z]);
          desks.push([x, 0, z - 0.44]);
        }
      }
    }

    return {
      seatPositions: seats,
      deskPositions: desks,
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
        roomType="classroom"
        utilRatio={utilRatio}
        isOvercap={isOvercap}
      />

      {/* Teacher Desk & Teacher Station at Front (z = -dimensions.length/2 + 1.5) */}
      <group position={[0, 0, -dimensions.length / 2 + 1.5]}>
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.72, 0.75]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[1.84, 0.04, 0.79]} />
          <meshStandardMaterial color="#FDE68A" roughness={0.45} />
        </mesh>
      </group>

      {/* Realistic Student Classroom Desks */}
      {deskPositions.map((pos, idx) => (
        <ClassroomDesk
          key={`desk-${idx}`}
          position={pos}
          width={0.76}
          depth={0.46}
          height={0.72}
        />
      ))}

      {/* Instanced Student Seats & Real Seated Human Avatars */}
      <SeatInstancer
        seatPositions={seatPositions}
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomType="classroom"
        dimensions={dimensions}
      />
    </group>
  );
}
