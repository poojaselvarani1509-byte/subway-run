
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_WIDTH, COLORS } from '../constants';
import { ObstacleData, CoinData, PowerUpData, PowerUpType, GameState } from '../types';

interface WorldProps {
  speed: number;
  score: number;
  gameState: GameState;
  obstacles: ObstacleData[];
  coins: CoinData[];
  powerUps: PowerUpData[];
  playerLane: number;
  isJumping: boolean;
  isRolling: boolean;
  currentPowerUp: PowerUpType;
  onCollision: (type: string) => void;
  onCoinCollect: (id: string) => void;
  onPowerUpCollect: (id: string, type: PowerUpType) => void;
}

const World: React.FC<WorldProps> = ({ 
  speed, score, gameState, obstacles, coins, powerUps, playerLane, isJumping, isRolling, currentPowerUp,
  onCollision, onCoinCollect, onPowerUpCollect 
}) => {
  const worldRef = useRef<THREE.Group>(null!);
  const obstacleRefs = useRef<{ [key: string]: THREE.Group }>({});
  const coinRefs = useRef<{ [key: string]: THREE.Mesh }>({});
  const powerUpRefs = useRef<{ [key: string]: THREE.Mesh }>({});
  const dustRef = useRef<THREE.Group>(null!);

  // Generate dust motes
  const dustMotes = useMemo(() => {
    return Array.from({ length: 100 }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 20, Math.random() * 10, (Math.random() - 0.5) * 50),
      speed: Math.random() * 0.2 + 0.1
    }));
  }, []);

  useFrame((state, delta) => {
    if (!worldRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    
    // Update Obstacles
    obstacles.forEach(obs => {
      const ref = obstacleRefs.current[obs.id];
      if (!ref) return;
      let obsZ = obs.z - score;
      if (obs.type === 'MOVING_TRAIN') obsZ -= elapsed * 10;
      ref.position.z = obsZ;

      if (gameState === GameState.PLAYING && obsZ < 1 && obsZ > -1 && obs.lane === playerLane) {
        let hit = false;
        if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN') hit = true;
        if (obs.type === 'BARRIER' && !isJumping) hit = true;
        if (obs.type === 'SCAFFOLD' && !isRolling) hit = true;
        if (hit) onCollision(obs.type);
      }
    });

    // Update Coins
    coins.forEach(coin => {
      const ref = coinRefs.current[coin.id];
      if (!ref) return;
      const coinZ = coin.z - score;
      ref.position.z = coinZ;
      ref.rotation.y += delta * 5;
      if (gameState === GameState.PLAYING && coinZ < 1.5 && coinZ > -1.5) {
        const magnetRange = currentPowerUp === PowerUpType.MAGNET ? 8 : 1.5;
        const dist = Math.abs(coin.lane * LANE_WIDTH - (playerLane * LANE_WIDTH));
        if (dist < magnetRange) onCoinCollect(coin.id);
      }
    });

    // Update Dust Motes
    if (dustRef.current) {
        dustRef.current.children.forEach((mote, i) => {
            const data = dustMotes[i];
            mote.position.y += Math.sin(elapsed + i) * 0.005;
            mote.position.z = ((data.pos.z - score * 0.5) % 50) + (data.pos.z > 0 ? 0 : 50);
        });
    }

    // Update Power-ups
    powerUps.forEach(pu => {
      const ref = powerUpRefs.current[pu.id];
      if (!ref) return;
      const puZ = pu.z - score;
      ref.position.z = puZ;
      ref.rotation.y += delta * 2;
      ref.position.y = 1.5 + Math.sin(elapsed * 4) * 0.2;
      if (gameState === GameState.PLAYING && puZ < 1 && puZ > -1 && pu.lane === playerLane) {
        onPowerUpCollect(pu.id, pu.type);
      }
    });
  });

  // Track ties (sleepers) array
  const ties = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => i * 5);
  }, []);

  return (
    <group ref={worldRef}>
      {/* Tracks and Floor */}
      <group position={[0, -0.1, 0]}>
        {/* Main Gravel Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[LANE_WIDTH * 6, 2000]} />
          <meshStandardMaterial color="#2c3e50" roughness={1} />
        </mesh>

        {/* Railway Ties (Sleepers) */}
        {ties.map((zOffset, i) => (
           <group key={i} position={[0, 0.05, (zOffset - (score % 5))]}>
             {[-1, 0, 1].map(l => (
               <mesh key={l} position={[l * LANE_WIDTH, 0, 0]} receiveShadow>
                 <boxGeometry args={[3.5, 0.15, 0.8]} />
                 <meshStandardMaterial color="#4b3621" />
               </mesh>
             ))}
           </group>
        ))}

        {/* Rails */}
        {[-1, 0, 1].map(l => (
          <group key={l} position={[l * LANE_WIDTH, 0, 0]}>
             <mesh position={[-0.8, 0.15, 500]} receiveShadow>
                <boxGeometry args={[0.15, 0.2, 2000]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.9} roughness={0.1} />
             </mesh>
             <mesh position={[0.8, 0.15, 500]} receiveShadow>
                <boxGeometry args={[0.15, 0.2, 2000]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.9} roughness={0.1} />
             </mesh>
          </group>
        ))}
      </group>

      {/* Side Walls with stylized graffiti placeholders */}
      <group position={[-LANE_WIDTH * 3, 5, 500]}>
        <mesh receiveShadow>
            <boxGeometry args={[1, 10, 2000]} />
            <meshStandardMaterial color="#5d6d7e" />
        </mesh>
        {/* Stylized Graffiti Splotches */}
        {Array.from({length: 20}).map((_, i) => (
            <mesh key={i} position={[0.51, Math.random()*4-2, (i*100)-1000]}>
                <planeGeometry args={[5, 4]} />
                <meshStandardMaterial color={['#e74c3c', '#f1c40f', '#9b59b6'][i%3]} transparent opacity={0.6} />
            </mesh>
        ))}
      </group>
      <group position={[LANE_WIDTH * 3, 5, 500]}>
        <mesh receiveShadow>
            <boxGeometry args={[1, 10, 2000]} />
            <meshStandardMaterial color="#5d6d7e" />
        </mesh>
        {Array.from({length: 20}).map((_, i) => (
            <mesh key={i} position={[-0.51, Math.random()*4-2, (i*100)-1000]}>
                <planeGeometry args={[5, 4]} />
                <meshStandardMaterial color={['#1abc9c', '#e67e22', '#3498db'][i%3]} transparent opacity={0.6} />
            </mesh>
        ))}
      </group>

      {/* Atmospheric Dust Motes */}
      <group ref={dustRef}>
        {dustMotes.map((mote, i) => (
          <mesh key={i} position={mote.pos}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>

      {/* Obstacles Rendering */}
      {obstacles.map(obs => (
        <group 
          key={obs.id} 
          position={[obs.lane * LANE_WIDTH, 0, obs.z]} 
          ref={el => el && (obstacleRefs.current[obs.id] = el)}
        >
          {obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' ? (
            <mesh position={[0, 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.2, 3.8, 12]} />
              <meshStandardMaterial color={obs.type === 'MOVING_TRAIN' ? '#c0392b' : '#34495e'} roughness={0.4} />
              {/* Painted details */}
              <mesh position={[0, 1, 6.01]}>
                  <planeGeometry args={[2.8, 1.2]} />
                  <meshStandardMaterial color="#aed6f1" emissive="#aed6f1" emissiveIntensity={0.2} />
              </mesh>
            </mesh>
          ) : obs.type === 'BARRIER' ? (
            <group position={[0, 0.5, 0]}>
              <mesh castShadow>
                <boxGeometry args={[LANE_WIDTH - 0.5, 1, 0.3]} />
                <meshStandardMaterial color={COLORS.BARRIER} />
              </mesh>
              <mesh position={[0, 0.3, 0.2]}>
                  <boxGeometry args={[LANE_WIDTH, 0.2, 0.1]} />
                  <meshStandardMaterial color="#fff" />
              </mesh>
            </group>
          ) : (
            <group position={[0, 3, 0]}>
              <mesh castShadow>
                 <boxGeometry args={[LANE_WIDTH, 0.2, 0.6]} />
                 <meshStandardMaterial color="#5d4037" />
              </mesh>
              <mesh position={[-LANE_WIDTH/2 + 0.15, -1.5, 0]}>
                 <boxGeometry args={[0.2, 3, 0.2]} />
                 <meshStandardMaterial color="#5d4037" />
              </mesh>
              <mesh position={[LANE_WIDTH/2 - 0.15, -1.5, 0]}>
                 <boxGeometry args={[0.2, 3, 0.2]} />
                 <meshStandardMaterial color="#5d4037" />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Coins Rendering */}
      {coins.map(coin => (
        <mesh 
          key={coin.id} 
          position={[coin.lane * LANE_WIDTH, 1.4, coin.z]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={el => el && (coinRefs.current[coin.id] = el)}
          castShadow
        >
          <cylinderGeometry args={[0.45, 0.45, 0.1, 24]} />
          <meshStandardMaterial color={COLORS.COIN} metalness={1} roughness={0.1} emissive={COLORS.COIN} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Power-ups Rendering */}
      {powerUps.map(pu => (
        <mesh 
          key={pu.id} 
          position={[pu.lane * LANE_WIDTH, 1.8, pu.z]}
          ref={el => el && (powerUpRefs.current[pu.id] = el)}
        >
          <octahedronGeometry args={[0.7]} />
          <meshStandardMaterial 
            color={pu.type === PowerUpType.HOVERBOARD ? "#00ffff" : pu.type === PowerUpType.JETPACK ? "#ff00ff" : "#ffff00"} 
            emissive={pu.type === PowerUpType.HOVERBOARD ? "#00ffff" : pu.type === PowerUpType.JETPACK ? "#ff00ff" : "#ffff00"} 
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
};

export default World;
