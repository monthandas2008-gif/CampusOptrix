import React, { useMemo } from 'react';
import { SeatedHumanStudent, StandingHumanStudent } from './HumanStudentMesh';
import { ErgonomicChair } from './FurnitureModels';

export default function SeatInstancer({
  seatPositions = [],
  seatRotations = [],
  capacity = 40,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  roomType = 'classroom',
  dimensions = { width: 10, length: 12 }
}) {
  const numSeats = seatPositions.length || capacity;
  const numOccupied = Math.min(numSeats, studentsCurrent);
  const overCapacityCount = Math.max(0, studentsCurrent - capacity);

  // Generate deterministic variations and slight angle jitter for seated students
  const studentInstances = useMemo(() => {
    const instances = [];
    for (let i = 0; i < numOccupied; i++) {
      const pos = seatPositions[i];
      const baseRot = seatRotations[i] || 0;
      if (pos) {
        // Natural slight yaw jitter (-0.05 to +0.05 radians) and slight scale jitter (0.98 to 1.02)
        const jitterRot = baseRot + ((i * 17) % 11 - 5) * 0.01;
        const jitterScale = 1.0 + (((i * 23) % 7 - 3) * 0.008);
        instances.push({
          pos: [pos[0], 0, pos[2]], // Grounded directly at y = 0
          rotation: jitterRot,
          scale: jitterScale,
          variantIndex: i
        });
      }
    }
    return instances;
  }, [seatPositions, seatRotations, numOccupied]);

  // Generate positions for standing overcapacity students along the back wall
  const standingInstances = useMemo(() => {
    if (overCapacityCount === 0) return [];
    const standing = [];
    const backZ = dimensions.length / 2 - 0.7;
    const spanX = dimensions.width * 0.65;
    const startX = -spanX / 2;
    const stepX = overCapacityCount > 1 ? spanX / (overCapacityCount - 1) : 0;

    for (let i = 0; i < overCapacityCount; i++) {
      const x = overCapacityCount === 1 ? 0 : startX + i * stepX;
      standing.push({
        pos: [x, 0, backZ],
        rotation: (i % 2 === 0 ? 0.1 : -0.1),
        scale: 1.0,
        variantIndex: i + numOccupied
      });
    }
    return standing;
  }, [overCapacityCount, dimensions, numOccupied]);

  return (
    <group>
      {/* 1. Realistic Ergonomic Chairs for EVERY seat in the room */}
      {seatPositions.map((pos, idx) => {
        const isSeatEmpty = idx >= numOccupied;
        const rot = seatRotations[idx] || 0;
        return (
          <ErgonomicChair
            key={`chair-${idx}`}
            position={[pos[0], pos[1] || 0, pos[2]]}
            rotation={rot}
            seatHeight={0.44}
            isEmpty={isSeatEmpty}
          />
        );
      })}

      {/* 2. Realistic Seated Human Student Avatars for OCCUPIED seats */}
      {studentInstances.map((inst, idx) => (
        <SeatedHumanStudent
          key={`student-${idx}`}
          position={[inst.pos[0], (seatPositions[idx]?.[1] || 0), inst.pos[2]]}
          rotation={inst.rotation}
          scale={inst.scale}
          variantIndex={inst.variantIndex}
        />
      ))}

      {/* 3. Standing Overcapacity Student Avatars near the back wall */}
      {standingInstances.map((inst, idx) => (
        <StandingHumanStudent
          key={`standing-${idx}`}
          position={inst.pos}
          rotation={inst.rotation}
          scale={inst.scale}
          variantIndex={inst.variantIndex}
        />
      ))}
    </group>
  );
}
