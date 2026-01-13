import React, { Suspense, useEffect, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, Sparkles, PerspectiveCamera, Float, Image, Text, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import { useStore } from '../store';
import { Avatar3D } from '../components/Avatar3D';
import { FireworksManager, InteractionManager } from '../components/VisualEffects';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { DisplayMode, Barrage, AppTheme } from '../types';
import { Play, UserPlus } from 'lucide-react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';

// Extend JSX.IntrinsicElements to include R3F elements and HTML elements (permissive to fix type conflicts)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- Theme Config ---
const THEMES: Record<AppTheme, any> = {
    nebula: {
        background: '#020617', // Slate 950
        fog: '#020617',
        primary: '#3b82f6', // Blue 500
        secondary: '#a855f7', // Purple 500
        accent: '#22d3ee', // Cyan 400
        danger: '#ef4444',
        textGradient: 'from-blue-400 via-indigo-400 to-purple-500',
        particleColor: '#93c5fd',
        rollingColor: '#fca5a5',
        starColor: '#ffffff'
    },
    festive: {
        background: '#450a0a', // Red 950
        fog: '#450a0a',
        primary: '#ef4444', // Red 500
        secondary: '#f59e0b', // Amber 500
        accent: '#fbbf24', // Amber 400
        danger: '#ffffff',
        textGradient: 'from-red-500 via-orange-500 to-yellow-500',
        particleColor: '#fbbf24', // Gold
        rollingColor: '#ffffff',
        starColor: '#fcd34d' // Amber 300
    },
    luxury: {
        background: '#0c0a09', // Stone 950
        fog: '#0c0a09',
        primary: '#d4af37', // Gold
        secondary: '#1c1917', // Stone 900
        accent: '#ffffff', 
        danger: '#ef4444',
        textGradient: 'from-yellow-200 via-yellow-500 to-yellow-700',
        particleColor: '#d4af37',
        rollingColor: '#ffffff',
        starColor: '#fffbeb'
    }
}

// --- Audio Manager (Web Audio API) ---
const AudioManager = ({ enabled }: { enabled: boolean }) => {
    const { status, theme } = useStore();
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }
        
        const ctx = audioContextRef.current;
        if (ctx?.state === 'suspended') ctx.resume();

        // Removed Ambient Drone (humming noise) as requested

        const playRollingSound = () => {
            if (!ctx || ctx.state !== 'running') return;
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
            
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }

        const playExplosionSound = () => {
            if (!ctx || ctx.state !== 'running') return;
            const t = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, t);
            osc.frequency.linearRampToValueAtTime(800, t + 1.5); 
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.5, t + 1);
            gain.gain.linearRampToValueAtTime(0, t + 2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2);
        }

        const playWinSound = () => {
             if (!ctx || ctx.state !== 'running') return;
             const t = ctx.currentTime;
             // Pentatonic for Festive, Major for others
             const notes = theme === 'festive' 
                ? [261.63, 293.66, 329.63, 392.00, 440.00] // C D E G A
                : [261.63, 329.63, 392.00, 587.33, 1046.50]; // C E G D C
             
             notes.forEach((freq, i) => {
                 const osc = ctx.createOscillator();
                 const gain = ctx.createGain();
                 osc.type = 'sine'; 
                 osc.frequency.value = freq;
                 
                 gain.gain.setValueAtTime(0, t);
                 gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
                 gain.gain.exponentialRampToValueAtTime(0.001, t + 4);
                 
                 osc.connect(gain);
                 gain.connect(ctx.destination);
                 osc.start(t);
                 osc.stop(t + 4);
             });
        }

        let interval: any;

        if (status === 'rolling') {
            interval = setInterval(playRollingSound, 100);
        } else if (status === 'exploded') {
            playExplosionSound();
        } else if (status === 'winner-revealed') {
            playWinSound();
        }

        return () => {
            if (interval) clearInterval(interval);
        }

    }, [status, enabled, theme]);

    return null;
}

// --- Layout Algorithms ---
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

const getHelixLayout = (count: number, radius: number) => {
    const points = [];
    const spacing = 0.25; // Compact spacing to fit screen
    const height = count * spacing;
    const offset = height / 2;
    
    for (let i = 0; i < count; i++) {
        const theta = i * 0.4; 
        const y = (i * spacing) - offset;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        points.push([x, y, z] as [number, number, number]);
    }
    return points;
}

const getGridLayout = (count: number) => {
    const points = [];
    const cols = Math.ceil(Math.sqrt(count * 1.5)); 
    const spacing = 3;
    
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rows = Math.ceil(count / cols);
        
        const x = (col - cols / 2) * spacing;
        const y = -(row - rows / 2) * spacing; 
        const z = -5; // Closer
        points.push([x, y, z] as [number, number, number]);
    }
    return points;
}

// --- Visual Components ---

const Connections = ({ positions, opacity = 0.2, color }: { positions: [number, number, number][], opacity?: number, color: string }) => {
  const geometry = useMemo(() => {
      const points: number[] = [];
      const vecPositions = positions.map(p => new THREE.Vector3(...p));
      const threshold = 5.5; 
      
      // Create a web-like structure
      for (let i = 0; i < vecPositions.length; i++) {
          let connections = 0;
          const windowSize = 25; // Look at neighbors
          const end = Math.min(i + windowSize, vecPositions.length);
          
          for (let j = i + 1; j < end; j++) {
              if (vecPositions[i].distanceToSquared(vecPositions[j]) < threshold * threshold) {
                   points.push(vecPositions[i].x, vecPositions[i].y, vecPositions[i].z);
                   points.push(vecPositions[j].x, vecPositions[j].y, vecPositions[j].z);
                   connections++;
                   if(connections > 3) break; 
              }
          }
      }
      
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      return geo;
  }, [positions]);

  return (
      <lineSegments geometry={geometry}>
          <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
  )
}

// --- Overlays ---

const WinnerOverlay = () => {
  const { winners, currentPrize, status, theme } = useStore();
  const latestWinner = winners[0];
  const themeColors = THEMES[theme || 'nebula'];

  if (status !== 'winner-revealed' || !latestWinner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden p-4"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] opacity-30 animate-spin-slow" 
              style={{ 
                  animationDuration: '10s',
                  background: `conic-gradient(from 0deg, ${themeColors.background}, ${themeColors.secondary}, ${themeColors.background})`
              }} 
         />
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="text-center p-6 md:p-12 relative z-10 w-full max-w-4xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full blur-[60px] md:blur-[100px] animate-pulse" 
             style={{ backgroundColor: `${themeColors.primary}40` }}
        />
        
        <motion.div 
          animate={{ rotateY: [0, 360] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="perspective-1000 mb-8 md:mb-12 inline-block"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 animate-ping opacity-30" style={{ borderColor: themeColors.accent }}></div>
            <img 
              src={latestWinner.avatar} 
              alt="Winner" 
              className="w-48 h-48 md:w-80 md:h-80 rounded-full border-4 md:border-8 shadow-2xl object-cover"
              style={{ borderColor: themeColors.accent, boxShadow: `0 0 100px ${themeColors.accent}80` }}
            />
             <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 text-black font-extrabold px-8 md:px-12 py-3 md:py-4 rounded-full text-xl md:text-3xl shadow-2xl border-4 border-white whitespace-nowrap tracking-wider transform hover:scale-105 transition-transform"
                style={{ 
                    background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.accent}, ${themeColors.primary})`
                }}
             >
              WINNER
            </div>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b ${themeColors.textGradient} mb-2 md:mb-4 drop-shadow-2xl truncate`}
        >
          {latestWinner.name}
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-4xl font-mono tracking-[0.3em] mb-8 md:mb-12 font-bold"
          style={{ color: themeColors.particleColor }}
        >
          NO. {latestWinner.code}
        </motion.p>
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 border border-white/20 p-6 md:p-8 rounded-3xl w-full mx-auto backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
             <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ backgroundColor: themeColors.accent }}>
                 <img src={currentPrize.image} className="w-full h-full object-cover rounded-xl" />
             </div>
             <div className="text-center md:text-left">
                <p className="text-xs md:text-sm uppercase tracking-widest font-bold mb-1" style={{ color: themeColors.accent }}>CONGRATULATIONS</p>
                <h2 className="text-xl md:text-3xl text-white font-bold leading-tight">{currentPrize.name}</h2>
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const RollingOverlay = () => {
  const { status, users, theme } = useStore();
  const [displayUser, setDisplayUser] = useState<any>(null);
  const themeColors = THEMES[theme || 'nebula'];

  useEffect(() => {
    if (status !== 'rolling') return;
    const interval = setInterval(() => {
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
      <div className="absolute inset-0 border-[10px] md:border-[20px] pointer-events-none" style={{ borderColor: `${themeColors.primary}20` }}></div>
      <div className="absolute top-1/2 left-0 w-full h-px" style={{ backgroundColor: `${themeColors.primary}40` }}></div>
      <div className="absolute left-1/2 top-0 w-px h-full" style={{ backgroundColor: `${themeColors.primary}40` }}></div>

      <div className="relative z-50 text-center transform scale-100 md:scale-150">
         <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl opacity-40 rounded-full animate-pulse" style={{ backgroundColor: themeColors.primary }}></div>
            {/* Glitch effect container */}
            <div className="relative overflow-hidden rounded-full w-32 h-32 md:w-48 md:h-48 border-4 mx-auto mb-4 bg-black" style={{ borderColor: themeColors.primary }}>
                <img 
                  src={displayUser.avatar} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t to-transparent" style={{ from: `${themeColors.background}80` }}></div>
            </div>
         </div>
         <div className="text-6xl md:text-8xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            {displayUser.code}
         </div>
         <div className="flex items-center justify-center gap-2 mt-4">
             <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: themeColors.danger }}></div>
             <p className="text-sm md:text-lg tracking-[0.5em] font-bold uppercase" style={{ color: themeColors.particleColor }}>System Rolling</p>
         </div>
      </div>
    </div>
  );
};

// --- Barrage (Danmaku) Overlay ---
interface BarrageItem extends Barrage {
    top: number; // Percentage
    duration: number; // Seconds
}

const BarrageOverlay = () => {
    const { lastBarrage } = useStore();
    const [barrages, setBarrages] = useState<BarrageItem[]>([]);

    useEffect(() => {
        if (!lastBarrage) return;

        const newItem: BarrageItem = {
            ...lastBarrage,
            top: 10 + Math.random() * 70, // 10% to 80% height
            duration: 8 + Math.random() * 8 // 8s to 16s duration
        };

        setBarrages(prev => [...prev, newItem]);

        setTimeout(() => {
            setBarrages(prev => prev.filter(b => b.id !== newItem.id));
        }, newItem.duration * 1000 + 1000);

    }, [lastBarrage]);

    return (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <AnimatePresence>
                {barrages.map(b => (
                    <motion.div
                        key={b.id}
                        initial={{ x: "100vw", opacity: 0 }}
                        animate={{ x: "-100vw", opacity: 1 }}
                        transition={{ 
                            duration: b.duration, 
                            ease: "linear",
                            delay: 0
                        }}
                        style={{ top: `${b.top}%` }}
                        className="absolute flex items-center gap-2 whitespace-nowrap bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-lg"
                    >
                        <img src={b.avatar} className="w-8 h-8 rounded-full border-2 border-white/50" />
                        <span className="text-lg md:text-2xl font-bold drop-shadow-md" style={{ color: b.color }}>
                            {b.text}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

const Header = () => {
  const { users, theme } = useStore();
  const mobileUrl = useMemo(() => `${window.location.href.split('#')[0]}#/mobile`, []);
  const themeColors = THEMES[theme || 'nebula'];

  return (
    <div className="absolute top-0 left-0 w-full z-30 p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-start bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none gap-4">
      <div className="pointer-events-auto">
        <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter italic">
          NEBULA<span className="not-italic" style={{ color: themeColors.primary }}>.LIVE</span>
        </h1>
        <div className="flex items-center gap-3 mt-1 md:mt-2">
            <div className="h-0.5 md:h-1 w-8 md:w-12" style={{ backgroundColor: themeColors.primary }}></div>
            <p className="text-slate-400 text-xs md:text-lg tracking-[0.3em] font-light uppercase">Interactive Lottery System</p>
        </div>
      </div>
      <div className="flex flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between md:justify-start pointer-events-auto gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-slate-700/50 shadow-2xl flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Online Users</span>
             <span className="text-2xl md:text-4xl font-mono font-bold text-white">{users.length}</span>
          </div>
          <div className="h-8 md:h-10 w-px bg-slate-700"></div>
           <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shadow-[0_0_10px_currentColor] animate-pulse" style={{ color: '#22c55e', backgroundColor: '#22c55e' }}></div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-xl transform origin-top-right hover:scale-105 transition-transform duration-300">
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mobileUrl)}`} 
             alt="QR" 
             className="w-12 h-12 md:w-24 md:h-24 rounded-lg mix-blend-multiply" 
           />
           <div className="pr-2 md:pr-4 text-slate-900">
             <p className="text-[8px] md:text-xs font-bold uppercase tracking-wider mb-0.5 md:mb-1" style={{ color: themeColors.primary }}>Join Event</p>
             <p className="text-sm md:text-xl font-black leading-none mb-0.5 md:mb-1">扫码签到</p>
             <p className="text-[8px] md:text-[10px] font-mono opacity-50 hidden sm:block">Scan to join lottery</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Enhanced Prize 3D Component ---
const Prize3D = () => {
    const { currentPrize, status, theme } = useStore();
    const group = useRef<THREE.Group>(null);
    const ring1 = useRef<THREE.Mesh>(null);
    const ring2 = useRef<THREE.Mesh>(null);
    const beamRef = useRef<THREE.Mesh>(null);
    const bgSphereRef = useRef<THREE.Mesh>(null);
    const themeColors = THEMES[theme || 'nebula'];
    
    // Hide prize during rolling and explosion
    const isVisible = status !== 'exploded' && status !== 'rolling';

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        
        if(group.current) {
            group.current.rotation.y += delta * 0.2;
            group.current.position.y = Math.sin(t) * 0.2;
        }
        if (ring1.current) {
            ring1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
            ring1.current.rotation.y += delta * 0.3;
            const s = 1 + Math.sin(t * 2) * 0.05;
            ring1.current.scale.set(s, s, s);
        }
        if (ring2.current) {
            ring2.current.rotation.x = Math.sin(t * 0.3) * 0.2;
            ring2.current.rotation.z += delta * 0.2;
        }
        if (beamRef.current) {
            beamRef.current.rotation.y -= delta * 0.1;
            (beamRef.current.material as THREE.Material).opacity = 0.06 + Math.sin(t * 3) * 0.02;
        }
        if (bgSphereRef.current) {
            bgSphereRef.current.rotation.z = t * 0.2;
        }
    });

    return (
        <group visible={isVisible}>
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
                {/* Tech Containment Field */}
                <Icosahedron args={[5.5, 0]}>
                    <meshBasicMaterial color={themeColors.particleColor} wireframe transparent opacity={0.15} />
                </Icosahedron>

                <group ref={group}>
                     {/* Base Pedestal */}
                     <mesh position={[0, -3.2, 0]}>
                        <cylinderGeometry args={[2, 2.5, 0.2, 32]} />
                        <meshStandardMaterial color={themeColors.secondary} emissive={themeColors.secondary} emissiveIntensity={0.5} opacity={0.9} transparent />
                     </mesh>

                     {/* Dynamic Energy Beam (Force Field) */}
                     <mesh ref={beamRef} position={[0, 1.5, 0]}>
                         <cylinderGeometry args={[2.8, 2.8, 8, 32, 1, true]} />
                         <meshBasicMaterial 
                            color={themeColors.primary}
                            transparent 
                            opacity={0.06} 
                            side={THREE.DoubleSide} 
                            blending={THREE.AdditiveBlending} 
                            depthWrite={false}
                         />
                     </mesh>
                     
                     {/* Background Distorted Portal */}
                     <mesh ref={bgSphereRef} position={[0, 0, -1]}>
                        <sphereGeometry args={[4, 32, 32]} />
                         <MeshDistortMaterial 
                            color={themeColors.secondary}
                            attach="material" 
                            distort={0.4} 
                            speed={2} 
                            roughness={0.2}
                            transparent
                            opacity={0.3}
                        />
                      </mesh>

                    {/* Main Image Panel */}
                    <group position={[0,0.5,0]}>
                        <mesh position={[0,0,-0.1]}>
                            <boxGeometry args={[7.2, 5.2, 0.2]} />
                            <meshStandardMaterial color={themeColors.primary} emissive={themeColors.primary} emissiveIntensity={0.8} />
                        </mesh>
                        <Image url={currentPrize.image} scale={[7, 5]} position={[0,0,0.1]} />
                    </group>
                    
                    <Text 
                        position={[0, -2.5, 0.5]} 
                        fontSize={0.6} 
                        color="white" 
                        font="https://fonts.gstatic.com/s/notosanssc/v26/k3kXo84MPvpLmixcA63oeALhLOCT-xWtmh1s.woff2"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.04}
                        outlineColor="#000000"
                    >
                        {currentPrize.name}
                    </Text>
                </group>
                
                {/* Holographic Rings */}
                <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[6, 0.05, 16, 100]} />
                    <meshBasicMaterial color={themeColors.primary} transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
                </mesh>
                <mesh ref={ring2}>
                    <torusGeometry args={[7.5, 0.02, 16, 100]} />
                    <meshBasicMaterial color={themeColors.particleColor} transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            </Float>
            
            {/* Layered Particles */}
            <Sparkles count={120} scale={[5, 7, 5]} size={6} speed={0.6} opacity={0.6} color={themeColors.accent} noise={0.2} />
            <Sparkles count={60} scale={[3, 9, 3]} size={12} speed={1.5} opacity={0.5} color={themeColors.primary} noise={0.1} position={[0,1,0]} />
            
            <spotLight position={[0, 10, 0]} intensity={200} angle={0.5} penumbra={0.8} color={themeColors.primary} distance={30} />
            <pointLight position={[0, -4, 0]} intensity={50} color={themeColors.primary} distance={10} />
        </group>
    )
}

const CameraRig = () => {
    const { status, displayMode } = useStore();
    const { size } = useThree();
    const isMobile = size.width < 1000;

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        let targetPos = new THREE.Vector3(0, 0, isMobile ? 40 : 34); // Pulled back slightly for better full view
        
        if (displayMode === 'grid') {
             targetPos.set(0, 0, isMobile ? 55 : 35);
        } else if (displayMode === 'helix') {
             targetPos.set(0, 0, isMobile ? 60 : 42); 
        }

        if (status === 'rolling') {
            targetPos.add(new THREE.Vector3(0, 0, 5));
            targetPos.x += (Math.random() - 0.5) * 0.5;
            targetPos.y += (Math.random() - 0.5) * 0.5;
        } else if (status === 'exploded') {
             targetPos.set(0, 0, isMobile ? 8 : 5); 
        } else if (status === 'winner-revealed') {
            targetPos.set(Math.sin(t * 0.2) * 5, Math.cos(t * 0.2) * 2, isMobile ? 35 : 25);
        } else {
            targetPos.x += Math.sin(t * 0.1) * 5;
            targetPos.y += Math.sin(t * 0.15) * 3;
        }

        state.camera.position.lerp(targetPos, delta * 2);
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

const SceneContent = ({ users, status, displayMode, theme }: { users: any[], status: string, displayMode: DisplayMode, theme: AppTheme }) => {
  const groupRef = React.useRef<THREE.Group>(null);
  const themeColors = THEMES[theme || 'nebula'];
  
  // Calculate positions for a fixed minimum count to ensure the shape is always defined
  const MIN_SLOTS = 200; // Increased to ensure shape is dense enough
  const activeCount = users.length;
  
  const positions = useMemo(() => {
     // Ensure we have enough points to show the shape
     const count = Math.max(activeCount, MIN_SLOTS);
     
     switch(displayMode) {
         case 'helix': return getHelixLayout(count, 10);
         case 'grid': return getGridLayout(count);
         case 'sphere': 
         default: return getSphereLayout(count, 14);
     }
  }, [activeCount, displayMode]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetSpeed = status === 'rolling' ? 6.0 : status === 'exploded' ? 20.0 : 0.15;
      
      if (status === 'rolling' || status === 'exploded') {
          groupRef.current.rotation.y += delta * targetSpeed;
          if (displayMode === 'sphere') {
              groupRef.current.rotation.z += delta * (status === 'exploded' ? 2 : 0.5);
          }
      } else {
          groupRef.current.rotation.y += delta * targetSpeed;
          groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 2);
          
          if (displayMode === 'grid') {
               const time = state.clock.getElapsedTime();
               groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.2;
          }
      }
    }
  });

  const sparkleProps = useMemo(() => {
      let count = 300;
      let scale: [number, number, number] = [20, 20, 20];
      let size = 4;
      let speed = 0.4;
      let opacity = 0.5;
      let noise = 0.5;

      // Layout adjustments
      if (displayMode === 'helix') {
          scale = [20, 50, 20];
      } else if (displayMode === 'grid') {
          scale = [60, 40, 10];
      }

      // Status adjustments
      if (status === 'rolling') {
          count = 1500;
          size = 10;
          speed = 4;
          opacity = 0.8;
          noise = 1; // More chaotic
      } else if (status === 'exploded') {
          count = 3000;
          size = 20;
          speed = 12; // Explosive
          scale = [10, 10, 10]; // Converge then explode visual effect
          opacity = 1;
          noise = 0; // Linear explosion lines
      } else if (status === 'winner-revealed') {
          count = 800;
          size = 6;
          speed = 1;
          opacity = 0.6;
      }

      return { count, scale, size, speed, opacity, noise };
  }, [status, displayMode]);

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      {displayMode === 'sphere' && (
        <mesh>
            <sphereGeometry args={[status === 'rolling' ? 1.5 : status === 'exploded' ? 0.1 : 6, 32, 32]} />
            <meshStandardMaterial 
            color={status === 'rolling' ? themeColors.danger : status === 'exploded' ? '#ffffff' : themeColors.secondary} 
            emissive={status === 'rolling' ? themeColors.danger : status === 'exploded' ? '#ffffff' : themeColors.secondary}
            emissiveIntensity={status === 'rolling' ? 5 : status === 'exploded' ? 20 : 0.5} 
            wireframe={status !== 'exploded'}
            transparent
            opacity={status === 'exploded' ? 1 : 0.3}
            />
        </mesh>
      )}
      
      {/* Volumetric Glow */}
      <pointLight 
        color={status === 'rolling' ? themeColors.danger : status === 'exploded' ? '#ffffff' : themeColors.primary} 
        intensity={status === 'rolling' ? 500 : status === 'exploded' ? 2000 : 100} 
        distance={40} 
        decay={2}
      />

      {(displayMode === 'sphere' || displayMode === 'helix') && <Prize3D />}

      {/* Connection Lines (Network Effect) */}
      {(displayMode === 'sphere' || displayMode === 'helix') && status !== 'exploded' && (
          <Connections positions={positions} color={themeColors.primary} opacity={0.3} />
      )}

      {/* Render Actual Users */}
      {users.map((user, i) => (
        <Avatar3D 
          key={user.id} 
          user={user} 
          position={positions[i] || [0,0,0]} 
          status={status}
        />
      ))}

      {/* Placeholders for empty slots to visualize the shape */}
      {Array.from({ length: Math.max(0, MIN_SLOTS - activeCount) }).map((_, i) => {
          const posIndex = activeCount + i;
          const pos = positions[posIndex] || [0,0,0];
          return (
             <mesh key={`placeholder-${i}`} position={pos}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial 
                    color={themeColors.particleColor} 
                    transparent 
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                />
             </mesh>
          )
      })}
      
      {/* Outer Particle Shell */}
      <group rotation={[0,0,Math.PI/4]}>
         <Sparkles 
            {...sparkleProps}
            color={status === 'rolling' ? themeColors.rollingColor : status === 'exploded' ? '#ffffff' : themeColors.particleColor}
         />
      </group>
    </group>
  );
};

const StartOverlay = ({ onStart }: { onStart: () => void }) => {
    const { generateMockUsers } = useStore();
    
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <button 
                onClick={onStart} 
                className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-full border border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all hover:scale-105"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-900 to-indigo-900 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <span className="relative text-2xl font-bold text-white tracking-[0.2em] uppercase flex items-center gap-4">
                    <Play className="w-8 h-8 fill-current text-blue-400" />
                    Enter System
                </span>
            </button>
            <p className="absolute bottom-10 text-slate-500 text-xs uppercase tracking-widest font-mono">
                Click to initialize Audio & Visual Engine
            </p>

            <div className="absolute bottom-4 right-4 flex gap-2">
                 <button 
                    onClick={(e) => { e.stopPropagation(); generateMockUsers(10); }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
                    title="Add mock users to test entrance animation"
                 >
                    <UserPlus className="w-3 h-3" />
                    +10 Test Users
                 </button>
             </div>
        </div>
    )
}

const CinematicEffects = () => {
    const { status } = useStore();
    const [chromaOffset, setChromaOffset] = useState([0, 0]);
    const [vignetteDarkness, setVignetteDarkness] = useState(0.4);
    const [bloomIntensity, setBloomIntensity] = useState(1);

    useFrame((state, delta) => {
        if (status === 'rolling') {
            const time = state.clock.elapsedTime;
            setChromaOffset([
                Math.sin(time * 20) * 0.005, 
                Math.cos(time * 15) * 0.005
            ]);
            setBloomIntensity(1.5);
        } else if (status === 'exploded') {
            setChromaOffset([0, 0]);
            setVignetteDarkness(THREE.MathUtils.lerp(vignetteDarkness, 0.8, delta * 2));
            setBloomIntensity(2); 
        } else if (status === 'winner-revealed') {
            setVignetteDarkness(THREE.MathUtils.lerp(vignetteDarkness, 0.5, delta));
            setBloomIntensity(2.5); 
            setChromaOffset([0, 0]);
        } else {
            setChromaOffset([0, 0]);
            setVignetteDarkness(THREE.MathUtils.lerp(vignetteDarkness, 0.4, delta));
            setBloomIntensity(1);
        }
    });

    return (
        <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={bloomIntensity} radius={0.6} />
            <ChromaticAberration offset={[chromaOffset[0], chromaOffset[1]] as any} />
            <Vignette eskil={false} offset={0.1} darkness={vignetteDarkness} />
        </EffectComposer>
    )
}

const BigScreen = () => {
  const { users, status, displayMode, barrageEnabled, theme } = useStore();
  const [started, setStarted] = useState(false);
  const themeColors = THEMES[theme || 'nebula'];
  
  const renderedUsers = useMemo(() => {
     return users.slice(0, 300);
  }, [users]);

  const handleStart = () => {
      setStarted(true);
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(e => console.log(e));
      }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none" style={{ backgroundColor: themeColors.background }}>
      {!started && <StartOverlay onStart={handleStart} />}
      
      <AudioManager enabled={started} />
      <Header />
      {barrageEnabled && <BarrageOverlay />}
      <AnimatePresence mode="wait">
        <WinnerOverlay key="winner" />
        <RollingOverlay key="rolling" />
      </AnimatePresence>

      <Canvas dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 28]} fov={45} />
        <color attach="background" args={[themeColors.background]} />
        <fog attach="fog" args={[themeColors.fog, 20, 90]} />
        
        <CameraRig />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <SceneContent users={renderedUsers} status={status} displayMode={displayMode} theme={theme || 'nebula'} />
          
          <FireworksManager />
          <InteractionManager />

          <ambientLight intensity={0.2} />
          <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={500} color={themeColors.primary} />
          <pointLight position={[-10, -10, -10]} intensity={500} color={themeColors.secondary} />
        </Suspense>
        
        <CinematicEffects />
      </Canvas>
    </div>
  );
};

export default BigScreen;