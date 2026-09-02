import React from 'react';

const STUDENT_VARIANTS = [
  {
    skin: '#E8B998', // Fair / Warm Peach
    hair: '#291811', // Deep Brown
    clothes: '#1E3A8A', // University Navy Hoodie
    pants: '#1E293B'
  },
  {
    skin: '#C6865A', // Golden Tan
    hair: '#111827', // Black
    clothes: '#0F766E', // Deep Teal Sweater
    pants: '#334155'
  },
  {
    skin: '#8D5524', // Rich Brown
    hair: '#171717', // Jet Black
    clothes: '#881337', // Burgundy Crewneck
    pants: '#475569'
  },
  {
    skin: '#F1C27D', // Warm Ivory
    hair: '#854D0E', // Auburn / Chestnut
    clothes: '#15803D', // Forest Green Jacket
    pants: '#1E293B'
  },
  {
    skin: '#5C381E', // Deep Espresso
    hair: '#0A0A0A', // Black Fade
    clothes: '#D97706', // Amber / Ochre Sweater
    pants: '#1E293B'
  },
  {
    skin: '#E0AC69', // Olive / Honey
    hair: '#B45309', // Dark Blonde
    clothes: '#475569', // Slate Grey Hoodie
    pants: '#0F172A'
  },
  {
    skin: '#C08863', // Warm Tan
    hair: '#262626', // Charcoal
    clothes: '#2563EB', // Royal Blue Tee
    pants: '#334155'
  },
  {
    skin: '#E8C5A0', // Light Peach
    hair: '#1C1917', // Dark Chocolate
    clothes: '#D97706', // Terracotta Shirt
    pants: '#1E293B'
  }
];

/**
 * Seated Human Student Avatar
 * Origin (0,0,0) is grounded on the floor directly beneath the student's hips.
 * Facing direction: -Z (towards the front whiteboard / screen).
 */
export function SeatedHumanStudent({ position = [0, 0, 0], rotation = 0, scale = 1, variantIndex = 0 }) {
  const variant = STUDENT_VARIANTS[variantIndex % STUDENT_VARIANTS.length];

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* 1. Head (with slight forward tilt towards front screen) */}
      <mesh position={[0, 0.96, -0.04]} castShadow>
        <sphereGeometry args={[0.115, 12, 10]} />
        <meshStandardMaterial color={variant.skin} roughness={0.6} />
      </mesh>

      {/* 2. Hair (Back and top of head, facing camera from rear) */}
      <mesh position={[0, 1.01, -0.02]} castShadow>
        <sphereGeometry args={[0.125, 10, 8]} />
        <meshStandardMaterial color={variant.hair} roughness={0.8} />
      </mesh>

      {/* 3. Neck */}
      <mesh position={[0, 0.84, -0.03]}>
        <cylinderGeometry args={[0.045, 0.055, 0.08, 8]} />
        <meshStandardMaterial color={variant.skin} roughness={0.6} />
      </mesh>

      {/* 4. Torso with Clothed Shirt/Hoodie */}
      <mesh position={[0, 0.64, 0]} castShadow>
        <boxGeometry args={[0.28, 0.36, 0.18]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>

      {/* 5. Shoulders / Collar Detail */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.34, 0.07, 0.2]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>

      {/* 6. Arms - Bent forward towards -Z resting on desk */}
      {/* Left Upper Arm */}
      <mesh position={[-0.17, 0.66, -0.04]} rotation={[-0.35, 0, -0.15]}>
        <boxGeometry args={[0.065, 0.22, 0.07]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Left Forearm (reaching forward towards desk at -Z) */}
      <mesh position={[-0.14, 0.54, -0.16]} rotation={[-1.25, 0.2, 0]}>
        <boxGeometry args={[0.055, 0.2, 0.055]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Left Hand (on desk at -Z) */}
      <mesh position={[-0.12, 0.54, -0.28]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color={variant.skin} roughness={0.6} />
      </mesh>

      {/* Right Upper Arm */}
      <mesh position={[0.17, 0.66, -0.04]} rotation={[-0.35, 0, 0.15]}>
        <boxGeometry args={[0.065, 0.22, 0.07]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Right Forearm (reaching forward towards desk at -Z) */}
      <mesh position={[0.14, 0.54, -0.16]} rotation={[-1.25, -0.2, 0]}>
        <boxGeometry args={[0.055, 0.2, 0.055]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Right Hand (on desk at -Z) */}
      <mesh position={[0.12, 0.54, -0.28]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color={variant.skin} roughness={0.6} />
      </mesh>

      {/* 7. Upper Thighs (Seated on chair seat at y = 0.44, extending forward to -Z) */}
      <mesh position={[-0.08, 0.42, -0.12]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.095, 0.24, 0.09]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.42, -0.12]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.095, 0.24, 0.09]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>

      {/* 8. Lower Legs & Shins (Extending from knee at -Z down to the floor at y=0) */}
      <mesh position={[-0.08, 0.22, -0.24]}>
        <boxGeometry args={[0.075, 0.36, 0.075]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.22, -0.24]}>
        <boxGeometry args={[0.075, 0.36, 0.075]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>

      {/* 9. Shoes (Grounded flat on floor at y = 0.03, pointing forward towards -Z) */}
      <mesh position={[-0.08, 0.03, -0.28]}>
        <boxGeometry args={[0.085, 0.055, 0.14]} />
        <meshStandardMaterial color="#0F172A" roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 0.03, -0.28]}>
        <boxGeometry args={[0.085, 0.055, 0.14]} />
        <meshStandardMaterial color="#0F172A" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Standing Human Student Avatar for Overcapacity Situations
 * Origin (0,0,0) is grounded on the floor.
 * Facing direction: -Z (towards the front whiteboard / screen).
 */
export function StandingHumanStudent({ position = [0, 0, 0], rotation = 0, scale = 1, variantIndex = 0 }) {
  const variant = STUDENT_VARIANTS[variantIndex % STUDENT_VARIANTS.length];

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* Head */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.115, 10, 8]} />
        <meshStandardMaterial color={variant.skin} roughness={0.6} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.53, 0.02]} castShadow>
        <sphereGeometry args={[0.125, 8, 6]} />
        <meshStandardMaterial color={variant.hair} roughness={0.8} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.28, 0.44, 0.18]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Left Arm by side */}
      <mesh position={[-0.17, 1.05, 0]}>
        <boxGeometry args={[0.065, 0.36, 0.07]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Right Arm holding notebook */}
      <mesh position={[0.17, 1.05, -0.06]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.065, 0.36, 0.07]} />
        <meshStandardMaterial color={variant.clothes} roughness={0.6} />
      </mesh>
      {/* Notebook Prop */}
      <mesh position={[0.14, 0.94, -0.16]} rotation={[-0.35, -0.2, 0]}>
        <boxGeometry args={[0.16, 0.22, 0.02]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
      </mesh>
      {/* Legs (Standing vertical grounded from y=0 to y=0.9) */}
      <mesh position={[-0.08, 0.45, 0]} castShadow>
        <boxGeometry args={[0.09, 0.88, 0.09]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.45, 0]} castShadow>
        <boxGeometry args={[0.09, 0.88, 0.09]} />
        <meshStandardMaterial color={variant.pants} roughness={0.7} />
      </mesh>
      {/* Shoes on the floor */}
      <mesh position={[-0.08, 0.03, -0.02]}>
        <boxGeometry args={[0.085, 0.055, 0.14]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[0.08, 0.03, -0.02]}>
        <boxGeometry args={[0.085, 0.055, 0.14]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
    </group>
  );
}
