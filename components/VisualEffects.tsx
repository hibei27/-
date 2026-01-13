import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

// --- Fireworks Effect ---
const FIREWORK_PARTICLES = 100;
const FIREWORK_GRAVITY = -0.05;

interface FireworkProps {
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

const Firework: React.FC<FireworkProps> = ({ position, color, onComplete }) => {
  const points = useRef<THREE.Points>(null);
  
  // Initialize particles
  const [data] = useState(() => {
    const positions = new Float32Array(FIREWORK_PARTICLES * 3);
    const velocities = [];
    const life = [];
    
    for (let i = 0; i < FIREWORK_PARTICLES; i++) {
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];
      
      // Explosion velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.2 + Math.random() * 0.3;
      
      velocities.push({
        x: speed * Math.sin(phi) * Math.cos(theta),
        y: speed * Math.sin(phi) * Math.sin(theta),
        z: speed * Math.cos(phi)
      });
      life.push(1.0); // Full life
    }
    return { positions, velocities, life };
  });

  useFrame(() => {
    if (!points.current) return;
    
    const posAttribute = points.current.geometry.attributes.position;
    let aliveCount = 0;

    for (let i = 0; i < FIREWORK_PARTICLES; i++) {
      if (data.life[i] > 0) {
        // Update physics
        data.positions[i * 3] += data.velocities[i].x;
        data.positions[i * 3 + 1] += data.velocities[i].y;
        data.positions[i * 3 + 2] += data.velocities[i].z;
        
        data.velocities[i].y += FIREWORK_GRAVITY * 0.5; // Gravity
        
        data.life[i] -= 0.015; // Fade out
        aliveCount++;
      }
    }
    
    posAttribute.needsUpdate = true;
    (points.current.material as THREE.PointsMaterial).opacity = Math.max(0, data.life[0]); // Hacky fade based on first particle

    if (aliveCount === 0) {
        onComplete();
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={data.positions.length / 3}
          array={data.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.5} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

export const FireworksManager = () => {
  const { status } = useStore();
  const [fireworks, setFireworks] = useState<{id: number, pos: [number,number,number], color: string}[]>([]);

  // Auto spawn fireworks when winner revealed
  useFrame(({ clock }) => {
    if (status === 'winner-revealed') {
       if (Math.random() < 0.05) { // 5% chance per frame
          const id = Date.now() + Math.random();
          const x = (Math.random() - 0.5) * 20;
          const y = (Math.random() - 0.5) * 10 + 5;
          const z = (Math.random() - 0.5) * 10 - 5;
          const color = new THREE.Color().setHSL(Math.random(), 1, 0.6).getStyle();
          
          setFireworks(prev => [...prev, { id, pos: [x,y,z], color }]);
       }
    }
  });

  const removeFirework = (id: number) => {
    setFireworks(prev => prev.filter(f => f.id !== id));
  };

  return (
    <group>
      {fireworks.map(f => (
        <Firework key={f.id} position={f.pos} color={f.color} onComplete={() => removeFirework(f.id)} />
      ))}
    </group>
  );
};

// --- Interaction Beam Effect ---
interface BeamProps {
    id: number;
    onComplete: (id: number) => void;
}

const InteractionBeam: React.FC<BeamProps> = ({ id, onComplete }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    // Start far out, move towards center (0,0,0)
    const [startPos] = useState(() => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 25; // Start radius
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    });

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Move towards center
            const dir = new THREE.Vector3(0,0,0).sub(meshRef.current.position).normalize();
            meshRef.current.position.add(dir.multiplyScalar(30 * delta)); // Fast speed
            
            // Look at center
            meshRef.current.lookAt(0,0,0);

            // If close to center, disappear
            if (meshRef.current.position.length() < 1) {
                onComplete(id);
            }
        }
    });

    return (
        <mesh ref={meshRef} position={startPos}>
            <cylinderGeometry args={[0.05, 0.2, 2, 8]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

export const InteractionManager = () => {
    const { lastInteraction } = useStore();
    const [beams, setBeams] = useState<{id: number}[]>([]);
    const prevInteractionRef = useRef(lastInteraction);

    // Watch for store updates
    useFrame(() => {
        if (lastInteraction > prevInteractionRef.current) {
            // New interaction detected
            const count = 1; // Maybe scale this if we get batched updates?
            const newBeams = Array.from({length: count}).map((_, i) => ({
                id: Date.now() + i
            }));
            setBeams(prev => [...prev, ...newBeams]);
            prevInteractionRef.current = lastInteraction;
        }
    });

    const removeBeam = (id: number) => {
        setBeams(prev => prev.filter(b => b.id !== id));
    };

    return (
        <group>
            {beams.map(b => (
                <InteractionBeam key={b.id} id={b.id} onComplete={removeBeam} />
            ))}
        </group>
    );
};
