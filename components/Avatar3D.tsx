import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Billboard, Text, Image, Float } from '@react-three/drei';
import * as THREE from 'three';
import { User } from '../types';

// Extend JSX.IntrinsicElements to include R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface Avatar3DProps {
  user: User;
  position: [number, number, number];
  isWinner?: boolean;
  status: string;
}

const AvatarImage = ({ url, scale, opacity, color }: { url: string, scale: number, opacity: number, color: string }) => {
    return (
        <Image 
            url={url} 
            scale={scale} 
            transparent 
            opacity={opacity}
            color={color} 
        />
    )
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ user, position, isWinner, status }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Randomize initial motion slightly
  const randomPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  // Memoize target position to avoid unnecessary allocations
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);

  // Determine appearance based on state
  const isRolling = status === 'rolling';
  
  // Visual config
  const scale = isWinner ? 5 : isRolling ? 1.5 : 2;
  const opacity = isWinner ? 1 : isRolling ? 0.4 : 0.9;
  
  // Use a slight tint for rolling, otherwise white
  const imageColor = isRolling ? "#60a5fa" : "white";
  const textColor = isWinner ? "#fbbf24" : isRolling ? "#60a5fa" : "white";

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
        // Smoothly interpolate current position to target position (Restore animation)
        // Using a factor of 3 * delta for responsive but smooth movement
        groupRef.current.position.lerp(targetPos, delta * 3);
        
        // Add subtle hover jitter if rolling
        if (isRolling && !isWinner) {
             groupRef.current.position.y += Math.sin(clock.elapsedTime * 10 + randomPhase) * 0.02;
        }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={speed} rotationIntensity={isWinner ? 0 : 0.5} floatIntensity={isWinner ? 0 : 0.5}>
        <Billboard follow={true}>
          {/* Backing Mesh - Always visible immediately */}
          <mesh position={[0, 0, -0.1]}>
             <circleGeometry args={[0.6, 32]} />
             <meshBasicMaterial 
                color={isWinner ? "#fbbf24" : "#1e40af"} 
                transparent 
                opacity={0.6} 
             />
          </mesh>

          {/* Suspense wrapper ensures the whole avatar doesn't hide while image loads */}
          <Suspense fallback={
              <mesh>
                  <circleGeometry args={[0.5, 32]} />
                  <meshBasicMaterial color="#334155" />
              </mesh>
          }>
              <AvatarImage 
                  url={user.avatar} 
                  scale={scale} 
                  opacity={opacity} 
                  color={imageColor} 
              />
          </Suspense>
          
          {!isRolling && (
            <Text
              position={[0, -1.2, 0]}
              fontSize={0.3}
              color={textColor}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {user.name}
            </Text>
          )}
        </Billboard>
      </Float>
    </group>
  );
};