
import React, { useRef } from 'react';
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

  // Unified animation and collision loop to fix invalid JSX useFrame tags
  useFrame((state, delta) => {
    if (!worldRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    
    // Update Obstacles positions and check for collisions
    obstacles.forEach(obs => {
      const ref = obstacleRefs.current[obs.id];
      if (!ref) return;

      // Calculate Z based on distance traveled (score)
      let obsZ = obs.z - score;
      if (obs.type === 'MOVING_TRAIN') {
        obsZ -= elapsed * 10; // Extra speed for moving trains
      }
      ref.position.z = obsZ;

      // Collision detection logic
      if (gameState === GameState.PLAYING && obsZ < 1 && obsZ > -1 && obs.lane === playerLane) {
        let hit = false;
        if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN') hit = true;
        if (obs.type === 'BARRIER' && !isJumping) hit = true;
        if (obs.type === 'SCAFFOLD' && !isRolling) hit = true;
        
        if (hit) onCollision(obs.type);
      }
    });

    // Update Coins positions and check for collection
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

    // Update Power-ups positions and check for collection
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

  return (
    <group ref={worldRef}>
      {/* Tracks and Floor */}
      <group position={[0, -0.1, 500]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[LANE_WIDTH * 4, 2000]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        {/* Rails */}
        {[-1, 0, 1].map(l => (
          <group key={l} position={[l * LANE_WIDTH, 0, 0]}>
             <mesh position={[-0.4, 0.05, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.1, 2000]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
             </mesh>
             <mesh position={[0.4, 0.05, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.1, 2000]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
             </mesh>
          </group>
        ))}
      </group>

      {/* Side Walls */}
      <group position={[-LANE_WIDTH * 2.5, 5, 500]}>
        <mesh receiveShadow>
            <boxGeometry args={[1, 10, 2000]} />
            <meshStandardMaterial color="#555" />
        </mesh>
      </group>
      <group position={[LANE_WIDTH * 2.5, 5, 500]}>
        <mesh receiveShadow>
            <boxGeometry args={[1, 10, 2000]} />
            <meshStandardMaterial color="#555" />
        </mesh>
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
              <meshStandardMaterial color={obs.type === 'MOVING_TRAIN' ? '#c0392b' : '#2c3e50'} />
              {/* Windows */}
              <mesh position={[0, 1, 6.01]}>
                  <planeGeometry args={[2.5, 1]} />
                  <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.5} />
              </mesh>
            </mesh>
          ) : obs.type === 'BARRIER' ? (
            <group position={[0, 0.5, 0]}>
              <mesh castShadow>
                <boxGeometry args={[LANE_WIDTH, 1, 0.2]} />
                <meshStandardMaterial color={COLORS.BARRIER} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                  <boxGeometry args={[LANE_WIDTH + 0.2, 0.1, 0.3]} />
                  <meshStandardMaterial color="#fff" />
              </mesh>
            </group>
          ) : (
            <group position={[0, 3, 0]}>
              <mesh castShadow>
                 <boxGeometry args={[LANE_WIDTH, 0.2, 0.5]} />
                 <meshStandardMaterial color="#8b4513" />
              </mesh>
              <mesh position={[-LANE_WIDTH/2 + 0.1, -1.5, 0]}>
                 <boxGeometry args={[0.2, 3, 0.2]} />
                 <meshStandardMaterial color="#8b4513" />
              </mesh>
              <mesh position={[LANE_WIDTH/2 - 0.1, -1.5, 0]}>
                 <boxGeometry args={[0.2, 3, 0.2]} />
                 <meshStandardMaterial color="#8b4513" />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Coins Rendering */}
      {coins.map(coin => (
        <mesh 
          key={coin.id} 
          position={[coin.lane * LANE_WIDTH, 1.2, coin.z]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={el => el && (coinRefs.current[coin.id] = el)}
          castShadow
        >
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color={COLORS.COIN} metalness={1} roughness={0.1} />
        </mesh>
      ))}

      {/* Power-ups Rendering */}
      {powerUps.map(pu => (
        <mesh 
          key={pu.id} 
          position={[pu.lane * LANE_WIDTH, 1.5, pu.z]}
          ref={el => el && (powerUpRefs.current[pu.id] = el)}
        >
          <octahedronGeometry args={[0.6]} />
          <meshStandardMaterial 
            color={pu.type === PowerUpType.HOVERBOARD ? "#00ffff" : pu.type === PowerUpType.JETPACK ? "#ff00ff" : "#ffff00"} 
            emissive={pu.type === PowerUpType.HOVERBOARD ? "#00ffff" : pu.type === PowerUpType.JETPACK ? "#ff00ff" : "#ffff00"} 
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
};

export default World;
