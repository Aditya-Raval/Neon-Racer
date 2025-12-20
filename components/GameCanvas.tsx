import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, ObstacleData, LANE_WIDTH, WORLD_SPEED_BASE } from '../types';

// --- Assets & Materials ---
const neonMaterialCyan = new THREE.MeshStandardMaterial({ 
  color: "#00ffff", 
  emissive: "#00ffff", 
  emissiveIntensity: 2,
  roughness: 0.2,
  metalness: 0.8
});

const neonMaterialMagenta = new THREE.MeshStandardMaterial({ 
  color: "#ff00ff", 
  emissive: "#ff00ff", 
  emissiveIntensity: 2,
  roughness: 0.2,
  metalness: 0.8
});

const gridMaterial = new THREE.MeshBasicMaterial({ 
  color: "#ff00ff", 
  wireframe: true,
  transparent: true,
  opacity: 0.3
});

// --- Components ---

const Sun = () => {
  return (
    <mesh position={[0, 20, -100]}>
      <circleGeometry args={[40, 32]} />
      <shaderMaterial
        transparent
        uniforms={{
          color1: { value: new THREE.Color("#ffbd00") }, // Orange
          color2: { value: new THREE.Color("#ff00ff") }, // Magenta
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 color1;
          uniform vec3 color2;
          void main() {
            // Stripes
            float stripes = step(0.1, sin(vUv.y * 40.0));
            vec3 color = mix(color1, color2, vUv.y);
            // Gradient circle
            if (vUv.y < 0.5 && stripes < 0.5) discard; 
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

const MovingGrid = ({ speed }: { speed: number }) => {
  const gridRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (gridRef.current) {
      // Move texture or mesh to simulate speed
      gridRef.current.position.z += speed * delta;
      if (gridRef.current.position.z > 20) {
        gridRef.current.position.z = 0;
      }
    }
  });

  return (
    <group>
        {/* Top grid (ceiling) purely for vibes */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 40, -50]}>
            <planeGeometry args={[200, 400, 40, 40]} />
            <meshBasicMaterial color="#2d0036" wireframe transparent opacity={0.1} />
        </mesh>
        
        {/* Ground Grid */}
        <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -50]}>
            <planeGeometry args={[200, 400, 40, 80]} />
            <primitive object={gridMaterial} />
        </mesh>
        
        {/* Solid floor below grid to block background stars */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
            <planeGeometry args={[500, 500]} />
            <meshBasicMaterial color="#0b0014" />
        </mesh>
    </group>
  );
};

const PlayerCar = ({ lane, isCrashed }: { lane: number; isCrashed: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetX = lane * LANE_WIDTH;

  // Reset rotation and position when respawning (isCrashed toggles false)
  // We exclude targetX from deps so this doesn't run on lane changes during gameplay, restoring interpolation
  useEffect(() => {
    if (!isCrashed && groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.position.set(targetX, 0.5, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCrashed]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Lerp to lane position
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 10);
      
      if (isCrashed) {
          groupRef.current.rotation.y += delta * 5;
          groupRef.current.rotation.x += delta * 2;
      } else {
          // Car tilt logic based on movement
          const tilt = (groupRef.current.position.x - targetX) * 0.1;
          groupRef.current.rotation.z = tilt;
          
          // Ensure car stays flat on other axes during gameplay
          groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 10);

          // Bobbing engine vibration relative to base height (0.5)
          groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 20) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.8, 0.5, 4]} />
        <meshStandardMaterial color="#222" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Top Cabin */}
      <mesh position={[0, 0.8, -0.5]}>
        <boxGeometry args={[1.4, 0.5, 2]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={1} />
      </mesh>
      {/* Windshield Neon */}
      <mesh position={[0, 0.81, 0.51]} rotation={[Math.PI/4, 0, 0]}>
         <planeGeometry args={[1.3, 0.1]} />
         <meshBasicMaterial color="#00ffff" />
      </mesh>
      {/* Neon Strips Sides */}
      <mesh position={[0.91, 0.3, 0]}>
         <boxGeometry args={[0.05, 0.1, 4]} />
         <primitive object={neonMaterialCyan} />
      </mesh>
      <mesh position={[-0.91, 0.3, 0]}>
         <boxGeometry args={[0.05, 0.1, 4]} />
         <primitive object={neonMaterialCyan} />
      </mesh>
      {/* Wheels */}
      <mesh position={[0.8, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.8, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.8, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.8, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {/* Tail Lights */}
      <mesh position={[0, 0.4, 2.01]}>
          <planeGeometry args={[1.6, 0.2]} />
          <primitive object={neonMaterialMagenta} />
      </mesh>
    </group>
  );
};

const Obstacle: React.FC<{ data: ObstacleData }> = ({ data }) => {
    // Visuals for obstacles
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame(() => {
        if(meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.rotation.z += 0.01;
        }
    });

    const Geometry = useMemo(() => {
        switch(data.type) {
            case 'pyramid': return <coneGeometry args={[1, 2, 4]} />;
            case 'pillar': return <cylinderGeometry args={[0.5, 0.5, 3, 8]} />;
            case 'block': return <boxGeometry args={[1.5, 1.5, 1.5]} />;
            default: return <boxGeometry args={[1, 1, 1]} />;
        }
    }, [data.type]);

    return (
        <group position={[data.x, 1, data.z]}>
            <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    {Geometry}
                    <primitive object={data.color === 'cyan' ? neonMaterialCyan : neonMaterialMagenta} />
                </mesh>
            </Float>
             {/* Simple Shadow */}
             <mesh position={[0, -0.95, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.8, 16]} />
                <meshBasicMaterial color="black" opacity={0.5} transparent />
             </mesh>
        </group>
    );
};

// --- Main Game Logic Component ---

interface GameSceneProps {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    onCrash: () => void;
}

const GameScene: React.FC<GameSceneProps> = ({ gameState, setGameState, setScore, onCrash }) => {
    const [lane, setLane] = useState(0);
    const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
    const [speed, setSpeed] = useState(WORLD_SPEED_BASE);
    
    // Refs for mutable state in loop
    const stateRef = useRef({
        lastSpawnZ: -50,
        scoreAccumulator: 0,
        isCrashed: false
    });

    // Reset game
    useEffect(() => {
        if (gameState === GameState.PLAYING) {
            setLane(0);
            setObstacles([]);
            setSpeed(WORLD_SPEED_BASE);
            stateRef.current.lastSpawnZ = -50;
            stateRef.current.scoreAccumulator = 0;
            stateRef.current.isCrashed = false;
        }
    }, [gameState]);

    // Input Handling - Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== GameState.PLAYING || stateRef.current.isCrashed) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                setLane(prev => Math.max(prev - 1, -1));
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                setLane(prev => Math.min(prev + 1, 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Input Handling - Touch/Swipe for Mobile
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50; // Minimum distance for a swipe to register
        
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        
        const handleTouchEnd = (e: TouchEvent) => {
            if (gameState !== GameState.PLAYING || stateRef.current.isCrashed) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Only register horizontal swipes (ignore mostly vertical swipes)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe right
                    setLane(prev => Math.min(prev + 1, 1));
                } else {
                    // Swipe left
                    setLane(prev => Math.max(prev - 1, -1));
                }
            }
        };
        
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gameState]);

    useFrame((state, delta) => {
        if (gameState !== GameState.PLAYING) return;
        if (stateRef.current.isCrashed) return;

        // Increase speed slowly
        const currentSpeed = speed + (delta * 0.5);
        setSpeed(currentSpeed);

        // Move obstacles
        setObstacles(prev => {
            const nextObstacles: ObstacleData[] = [];
            let collision = false;
            
            // Player Bounds (approximate)
            const playerX = lane * LANE_WIDTH;
            const playerZ = 0;
            
            prev.forEach(obs => {
                // Move obstacle towards camera (+Z)
                const newZ = obs.z + (currentSpeed * delta);
                
                // Collision Detection
                // Simple AABB check. Player is at Z=0.
                if (Math.abs(newZ - playerZ) < 1.5 && Math.abs(obs.x - playerX) < 1.5) {
                    collision = true;
                }

                if (newZ < 20) {
                    nextObstacles.push({ ...obs, z: newZ });
                }
            });

            if (collision) {
                stateRef.current.isCrashed = true;
                onCrash();
            }

            return nextObstacles;
        });

        // Spawn logic
        const spawnChance = delta * (currentSpeed / 20); // Faster speed = more frequent spawns
        if (Math.random() < spawnChance) {
             const newLane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
             const spawnZ = -120;
             
             setObstacles(prev => {
                 const tooClose = prev.some(o => o.z < -100 && Math.abs(o.x - (newLane * LANE_WIDTH)) < 0.1);
                 if (!tooClose) {
                     return [...prev, {
                         id: Math.random().toString(),
                         x: newLane * LANE_WIDTH,
                         z: spawnZ,
                         type: Math.random() > 0.5 ? 'pyramid' : (Math.random() > 0.5 ? 'pillar' : 'block'),
                         color: Math.random() > 0.5 ? 'cyan' : 'magenta'
                     }];
                 }
                 return prev;
             });
        }

        // Score
        stateRef.current.scoreAccumulator += delta * 10;
        setScore(Math.floor(stateRef.current.scoreAccumulator));

    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={60} rotation={[-0.2, 0, 0]} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ff00ff" />
            <pointLight position={[-10, 10, 10]} intensity={1} color="#00ffff" />
            
            <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <fog attach="fog" args={['#2d0036', 10, 110]} />

            <Sun />
            <MovingGrid speed={gameState === GameState.PLAYING && !stateRef.current.isCrashed ? speed : 0} />
            
            <PlayerCar lane={lane} isCrashed={stateRef.current.isCrashed} />
            
            {obstacles.map(obs => (
                <Obstacle key={obs.id} data={obs} />
            ))}
        </>
    );
};

interface GameCanvasProps {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    onCrash: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
        <Canvas gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
            <Suspense fallback={<Text position={[0,0,-5]} color="white">LOADING...</Text>}>
                <GameScene {...props} />
            </Suspense>
        </Canvas>
    </div>
  );
};