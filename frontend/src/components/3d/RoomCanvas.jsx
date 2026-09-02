import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';

import ClassroomTemplate from './templates/ClassroomTemplate';
import ComputerLabTemplate from './templates/ComputerLabTemplate';
import ScienceLabTemplate from './templates/ScienceLabTemplate';
import SeminarHallTemplate from './templates/SeminarHallTemplate';
import LectureHallTemplate from './templates/LectureHallTemplate';

function FloatingOccupancyBadge({ room, studentsCurrent, capacity, isOvercap, utilRatio }) {
  let badgeColor = '#45A970';
  let badgeText = `${studentsCurrent}/${capacity} Occupied (${(utilRatio * 100).toFixed(0)}%)`;

  if (isOvercap) {
    badgeColor = '#E03131';
    badgeText = `+${studentsCurrent - capacity} OVER CAPACITY`;
  } else if (utilRatio <= 0.3 && studentsCurrent > 0) {
    badgeColor = '#D5A13A';
    badgeText = `${studentsCurrent}/${capacity} Low Occupancy (${(utilRatio * 100).toFixed(0)}%)`;
  } else if (studentsCurrent === 0) {
    badgeColor = '#64748B';
    badgeText = `0/${capacity} Empty Space`;
  }

  return (
    <Html position={[0, 4.2, 0]} center distanceFactor={14}>
      <div style={{
        background: 'rgba(23, 32, 51, 0.88)',
        backdropFilter: 'blur(4px)',
        border: `1.5px solid ${badgeColor}`,
        color: '#FFFFFF',
        padding: '4px 10px',
        borderRadius: '20px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none'
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: badgeColor,
          display: 'inline-block'
        }} />
        <span>{badgeText}</span>
      </div>
    </Html>
  );
}

export default function RoomCanvas({
  room,
  studentsCurrent = 0,
  viewMode = 'OCCUPANCY',
  onResetView
}) {
  const controlsRef = useRef();

  const capacity = room?.capacity || 40;
  const rawType = (room?.room_type || '').toLowerCase();
  const isOvercap = studentsCurrent > capacity;
  const utilRatio = capacity > 0 ? studentsCurrent / capacity : 0;

  // Determine template based on room_type and name
  const isComputerLab = rawType.includes('computer') || room?.room_name?.toLowerCase().includes('computing');
  const isScienceLab = rawType.includes('science') || (rawType.includes('lab') && !isComputerLab);
  const isLectureHall = rawType.includes('lecture') || capacity >= 70;
  const isSeminarHall = rawType.includes('seminar') || rawType.includes('auditorium');

  function renderTemplate() {
    if (isComputerLab) {
      return (
        <ComputerLabTemplate
          capacity={capacity}
          studentsCurrent={studentsCurrent}
          viewMode={viewMode}
          roomName={room.room_name}
        />
      );
    }
    if (isScienceLab) {
      return (
        <ScienceLabTemplate
          capacity={capacity}
          studentsCurrent={studentsCurrent}
          viewMode={viewMode}
          roomName={room.room_name}
        />
      );
    }
    if (isSeminarHall) {
      return (
        <SeminarHallTemplate
          capacity={capacity}
          studentsCurrent={studentsCurrent}
          viewMode={viewMode}
          roomName={room.room_name}
        />
      );
    }
    if (isLectureHall) {
      return (
        <LectureHallTemplate
          capacity={capacity}
          studentsCurrent={studentsCurrent}
          viewMode={viewMode}
          roomName={room.room_name}
        />
      );
    }
    return (
      <ClassroomTemplate
        capacity={capacity}
        studentsCurrent={studentsCurrent}
        viewMode={viewMode}
        roomName={room.room_name}
      />
    );
  }

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [8, 9, 12], fov: 42 }}
      shadows
      style={{ background: '#F8FAFC', width: '100%', height: '100%' }}
    >
      {/* 3-Point Studio Lighting */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-8, 10, -10]} intensity={0.45} />

      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={5}
        maxDistance={25}
        target={[0, 0.5, 0]}
      />

      <Suspense fallback={null}>
        {renderTemplate()}

        {/* Floating Occupancy Status Billboard */}
        <FloatingOccupancyBadge
          room={room}
          studentsCurrent={studentsCurrent}
          capacity={capacity}
          isOvercap={isOvercap}
          utilRatio={utilRatio}
        />

        {/* Grounding Contact Shadows (Tightened blur and grounded at floor y = -0.01) */}
        <ContactShadows
          position={[0, -0.008, 0]}
          opacity={0.45}
          scale={22}
          blur={1.2}
          far={3.5}
        />
      </Suspense>
    </Canvas>
  );
}
