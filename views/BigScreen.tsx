import React, { Suspense, useEffect, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Stars, Environment, Sparkles, PerspectiveCamera, Float, Image, Text } from '@react-three/drei';
import { useStore } from '../store';
import { Avatar3D } from '../components/Avatar3D';
import { FireworksManager, InteractionManager } from '../components/VisualEffects';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { DisplayMode } from '../types';

// Extend JSX.IntrinsicElements to include R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Layout Algorithms ---

// Sphere (Fibonacci)
const getSphereLayout = (count: number, radius: number) => {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push([x * radius, y * radius, z * radius] as [number, number, number]);
  }
  return points;
};

// Helix / DNA
const getHelixLayout = (count: number, radius: number) => {
    const points = [];
    const spacing = 0.5; // Vertical spacing
    const height = count * spacing;
    const offset = height / 2;
    
    for (let i = 0; i < count; i++) {
        const theta = i * 0.4; // Twist factor
        const y = (i * spacing) - offset;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        points.push([x, y, z] as [number, number, number]);
    }
    return points;
}

// Grid (Wall)
const getGridLayout = (count: number) => {
    const points = [];
    const cols = Math.ceil(Math.sqrt(count * 1.5)); // Aspect ratio adjust
    const spacing = 3.5;
    
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = (col - cols / 2) * spacing;
        const y = -(row - (count/cols)/2) * spacing; // Invert Y to build top-down
        const z = 0;
        points.push([x, y, z] as [number, number, number]);
    }
    return points;
}


const WinnerOverlay = () => {
  const { winners, currentPrize, status } = useStore();
  const latestWinner = winners[0];

  if (status !== 'winner-revealed' || !latestWinner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] bg-gradient-conic from-blue-900 via-purple-900 to-blue-900 opacity-30 animate-spin-slow" style={{ animationDuration: '10s' }} />
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="text-center p-12 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[100px] animate-pulse" />
        
        <motion.div 
          animate={{ rotateY: [0, 360] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="perspective-1000 mb-12 inline-block"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-300 animate-ping opacity-30"></div>
            <img 
              src={latestWinner.avatar} 
              alt="Winner" 
              className="w-80 h-80 rounded-full border-8 border-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.6)] object-cover"
            />
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black font-extrabold px-12 py-4 rounded-full text-3xl shadow-2xl border-4 border-white whitespace-nowrap tracking-wider transform hover:scale-105 transition-transform">
              WINNER
            </div>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-500 mb-4 drop-shadow-2xl"
        >
          {latestWinner.name}
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl text-blue-200 font-mono tracking-[0.3em] mb-12 font-bold"
        >
          NO. {latestWinner.code}
        </motion.p>
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 border border-white/20 p-8 rounded-3xl max-w-3xl mx-auto backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center justify-center gap-6">
             <div className="h-16 w-16 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                 <img src={currentPrize.image} className="w-full h-full object-cover rounded-xl" />
             </div>
             <div className="text-left">
                <p className="text-yellow-400 text-sm uppercase tracking-widest font-bold mb-1">CONGRATULATIONS</p>
                <h2 className="text-3xl text-white font-bold">{currentPrize.name}</h2>
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const RollingOverlay = () => {
  const { status, users } = useStore();
  const [displayUser, setDisplayUser] = useState<any>(null);

  useEffect(() => {
    if (status !== 'rolling') return;
    const interval = setInterval(() => {
      // Use a slightly larger step to make it feel "fast"
      const randomUser = users[Math.floor(Math.random() * users.length)];
      setDisplayUser(randomUser);
    }, 50); 
    return () => clearInterval(interval);
  }, [status, users]);

  if (status !== 'rolling' || !displayUser) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      
      {/* HUD Lines */}
      <div className="absolute inset-0 border-[20px] border-blue-500/10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-blue-500/30"></div>
      <div className="absolute left-1/2 top-0 w-px h-full bg-blue-500/30"></div>

      <div className="relative z-50 text-center transform scale-150">
         <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-40 rounded-full animate-pulse"></div>
            {/* Glitch effect container */}
            <div className="relative overflow-hidden rounded-full w-48 h-48 border-4 border-blue-400 mx-auto mb-4 bg-black">
                <img 
                  src={displayUser.avatar} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
            </div>
         </div>
         <div className="text-8xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
            {displayUser.code}
         </div>
         <div className="flex items-center justify-center gap-2 mt-4">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
             <p className="text-blue-300 text-lg tracking-[0.5em] font-bold uppercase">System Rolling</p>
         </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { users } = useStore();
  const mobileUrl = useMemo(() => `${window.location.href.split('#')[0]}#/mobile`, []);

  return (
    <div className="absolute top-0 left-0 w-full z-30 p-8 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
      <div className="pointer-events-auto">
        <h1 className="text-6xl font-display font-black text-white tracking-tighter italic">
          NEBULA<span className="text-blue-500 not-italic">.LIVE</span>
        </h1>
        <div className="flex items-center gap-3 mt-2">
            <div className="h-1 w-12 bg-blue-500"></div>
            <p className="text-slate-400 text-lg tracking-[0.3em] font-light uppercase">Interactive Lottery System</p>
        </div>
      </div>
      <div className="flex flex-col items-end pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-slate-700/50 shadow-2xl flex items-center gap-4 mb-4">
          <div className="flex flex-col items-end">
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Online Users</span>
             <span className="text-4xl font-mono font-bold text-white">{users.length}</span>
          </div>
          <div className="h-10 w-px bg-slate-700"></div>
           <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-xl transform origin-top-right hover:scale-105 transition-transform duration-300">
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mobileUrl)}`} 
             alt="QR" 
             className="w-24 h-24 rounded-lg mix-blend-multiply" 
           />
           <div className="pr-4 text-slate-900">
             <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Join Event</p>
             <p className="text-xl font-black leading-none mb-1">扫码签到</p>
             <p className="text-[10px] font-mono opacity-50">Scan to join lottery</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Prize 3D Component ---
const Prize3D = () => {
    const { currentPrize, status } = useStore();
    const mesh = useRef<THREE.Group>(null);
    
    // Hide prize during rolling or if winner revealed (since it shows in overlay)
    const isVisible = status === 'idle';

    useFrame((state, delta) => {
        if(mesh.current) {
            mesh.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group visible={isVisible}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <group ref={mesh}>
                    {/* Glowing Backplate */}
                    <mesh position={[0,0,-0.5]}>
                        <boxGeometry args={[7, 5, 0.5]} />
                        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
                    </mesh>
                    
                    {/* Image Card */}
                    <Image url={currentPrize.image} scale={[6, 4]} position={[0,0,0.1]} />
                    
                    {/* Frame */}
                    <mesh position={[0,0,0]}>
                        <boxGeometry args={[6.2, 4.2, 0.4]} />
                        <meshStandardMaterial color="#1e293b" wireframe />
                    </mesh>
                    
                    {/* Text Label */}
                    <Text 
                        position={[0, -2.8, 0]} 
                        fontSize={0.5} 
                        color="white" 
                        font="https://fonts.gstatic.com/s/notosanssc/v26/k3kXo84MPvpLmixcA63oeALhLOCT-xWtmh1s.woff2"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {currentPrize.name}
                    </Text>
                </group>
            </Float>
            <Sparkles count={50} scale={10} size={5} speed={0.4} opacity={0.5} color="#fbbf24" />
        </group>
    )
}

// --- Camera Rig for dynamic movement ---
const CameraRig = () => {
    const { status, displayMode } = useStore();
    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        
        // Base position determined by mode
        let targetPos = new THREE.Vector3(0, 0, 28);
        
        if (displayMode === 'grid') {
             targetPos.set(0, 0, 35);
        } else if (displayMode === 'helix') {
             targetPos.set(0, 0, 40); // Need to be further back for helix
        }

        if (status === 'rolling') {
            // Shake and zoom out slightly to show speed
            targetPos.add(new THREE.Vector3(0, 0, 5));
            // Add subtle shake
            targetPos.x += (Math.random() - 0.5) * 0.5;
            targetPos.y += (Math.random() - 0.5) * 0.5;
        } else if (status === 'winner-revealed') {
            // Smooth slow motion drift
            targetPos.set(Math.sin(t * 0.2) * 5, Math.cos(t * 0.2) * 2, 25);
        } else {
            // Idle breathing movement
            targetPos.x += Math.sin(t * 0.1) * 5;
            targetPos.y += Math.sin(t * 0.15) * 3;
        }

        // Smooth interpolation
        state.camera.position.lerp(targetPos, delta * 2);
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

// Component to handle scene rotation logic
const SceneContent = ({ users, status, displayMode }: { users: any[], status: string, displayMode: DisplayMode }) => {
  const groupRef = React.useRef<THREE.Group>(null);
  
  // Calculate positions based on mode
  const positions = useMemo(() => {
     const count = Math.max(users.length, 50);
     switch(displayMode) {
         case 'helix': return getHelixLayout(count, 8);
         case 'grid': return getGridLayout(count);
         case 'sphere': 
         default: return getSphereLayout(count, 14);
     }
  }, [users.length, displayMode]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Dynamic rotation speed
      const targetSpeed = status === 'rolling' ? 6.0 : 0.15;
      
      if (status === 'rolling') {
          groupRef.current.rotation.y += delta * targetSpeed;
          // Only tilt sphere, helix stays vertical usually looks better
          if (displayMode === 'sphere') {
              groupRef.current.rotation.z += delta * 0.5;
          }
      } else {
          groupRef.current.rotation.y += delta * targetSpeed;
          // Return Z to 0 smoothly
          groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 2);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Core (Only for Sphere) */}
      {displayMode === 'sphere' && (
        <mesh>
            <sphereGeometry args={[status === 'rolling' ? 1.5 : 3, 32, 32]} />
            <meshStandardMaterial 
            color={status === 'rolling' ? "#ef4444" : "#1e40af"} 
            emissive={status === 'rolling' ? "#ef4444" : "#1e40af"}
            emissiveIntensity={status === 'rolling' ? 5 : 1}
            wireframe
            transparent
            opacity={0.2}
            />
        </mesh>
      )}
      
      {/* Volumetric Glow */}
      <pointLight 
        color={status === 'rolling' ? "#ef4444" : "#60a5fa"} 
        intensity={status === 'rolling' ? 500 : 100} 
        distance={40} 
        decay={2}
      />

      {/* Prize Display in center */}
      {displayMode === 'sphere' && <Prize3D />}

      {/* Users */}
      {users.map((user, i) => (
        <Avatar3D 
          key={user.id} 
          user={user} 
          position={positions[i] || [0,0,0]} 
          status={status}
        />
      ))}
      
      {/* Outer Particle Shell */}
      <group rotation={[0,0,Math.PI/4]}>
         <Sparkles 
            count={status === 'rolling' ? 500 : 200} 
            scale={20} 
            size={status === 'rolling' ? 8 : 4} 
            speed={status === 'rolling' ? 2 : 0.4} 
            opacity={0.6}
            color={status === 'rolling' ? "#fca5a5" : "#93c5fd"}
            noise={0.5}
         />
      </group>
    </group>
  );
};

const BigScreen = () => {
  const { users, status, displayMode } = useStore();
  
  // Limit rendered avatars to prevent performance drop on massive screens
  const renderedUsers = useMemo(() => {
     return users.slice(0, 300); // Render max 300 avatars 
  }, [users]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <Header />
      <AnimatePresence mode="wait">
        <WinnerOverlay key="winner" />
        <RollingOverlay key="rolling" />
      </AnimatePresence>

      <Canvas dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 28]} fov={45} />
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 10, 80]} />
        
        <CameraRig />

        <Suspense fallback={null}>
          <Environment preset="city" />
          {/* Moving Starfield */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <SceneContent users={renderedUsers} status={status} displayMode={displayMode} />
          
          <FireworksManager />
          <InteractionManager />

          {/* Cinematic Lighting */}
          <ambientLight intensity={0.2} />
          <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={500} color="#4f46e5" />
          <pointLight position={[-10, -10, -10]} intensity={500} color="#c026d3" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default BigScreen;