import React, { useRef, useMemo, Suspense, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Image, Float } from '@react-three/drei';
import * as THREE from 'three';
import { User } from '../types';

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
  const mountRef = useRef(false);
  
  // Randomize initial motion slightly
  const randomPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  // Memoize target position to avoid unnecessary allocations
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);

  // Determine appearance based on state
  const isRolling = status === 'rolling';
  const isExploded = status === 'exploded';
  
  // Visual config
  // When exploded, we shrink non-winners rapidly
  const scale = isWinner ? 5 : isExploded ? 0.5 : isRolling ? 1.5 : 2;
  const opacity = isWinner ? 1 : isExploded ? 0.8 : isRolling ? 0.4 : 0.9;
  
  // Use a slight tint for rolling, otherwise white
  const imageColor = isRolling ? "#60a5fa" : "white";
  const textColor = isWinner ? "#fbbf24" : isRolling ? "#60a5fa" : "white";

  // Check if user is "new" (joined within last 5 seconds) to trigger entrance animation
  const isNew = useMemo(() => {
      return (Date.now() - user.joinedAt) < 5000;
  }, [user.joinedAt]);

  // Initial positioning 
  useLayoutEffect(() => {
    if (groupRef.current && !mountRef.current) {
        if (isNew) {
            // New users fly in from center (emission effect)
            groupRef.current.position.set(
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2
            );
            groupRef.current.scale.set(0, 0, 0);
        } else {
            // Existing users snap to position
            groupRef.current.position.set(...position);
        }
        mountRef.current = true;
    }
  }, []);

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
        // Entrance scale animation
        if (groupRef.current.scale.x < 1) {
             groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 3);
        }

        if (isExploded) {
            // VORTEX EFFECT
            // Calculate distance to center
            const currentPos = groupRef.current.position;
            const dist = currentPos.length();
            
            // Spiral inwards
            if (dist > 0.5) {
                // Move towards center
                const direction = currentPos.clone().negate().normalize();
                const moveSpeed = 15 + (20 / (dist + 0.1)); // Gets faster as it gets closer
                
                groupRef.current.position.add(direction.multiplyScalar(moveSpeed * delta));
                
                // Spiral rotation (tangential movement)
                const axis = new THREE.Vector3(0, 1, 0);
                groupRef.current.position.applyAxisAngle(axis, 5 * delta);
                
                // Suck into y=0 plane
                groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 5);
            } else {
                // Jitter at singularity
                groupRef.current.position.set(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                );
            }
            
        } else {
            // Normal behavior: Smoothly interpolate current position to target position
            // Using a factor of 3 * delta for responsive but smooth movement
            
            groupRef.current.position.lerp(targetPos, delta * 3);
            
            // Add subtle hover jitter if rolling
            if (isRolling && !isWinner) {
                 groupRef.current.position.y += Math.sin(clock.elapsedTime * 10 + randomPhase) * 0.02;
            }
        }
    }
  });

  return (
    <group ref={groupRef}>
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
          
          {!isRolling && !isExploded && (
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