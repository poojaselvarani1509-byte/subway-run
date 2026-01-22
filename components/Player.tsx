
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_WIDTH, JUMP_HEIGHT, GRAVITY, COLORS } from '../constants';
import { PowerUpType } from '../types';

interface PlayerProps {
  lane: number;
  isJumping: boolean;
  isRolling: boolean;
  powerUp: PowerUpType;
  onCollision: (obj: any) => void;
  speed: number;
}

const Player: React.FC<PlayerProps> = ({ lane, isJumping, isRolling, powerUp, speed }) => {
  const meshRef = useRef<THREE.Group>(null!);
  const [yPos, setYPos] = useState(0);
  const [yVelocity, setYVelocity] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  // Smooth lane movement
  useFrame((state, delta) => {
    const targetX = lane * LANE_WIDTH;
    const lerpSpeed = 10;
    setCurrentX((prev) => THREE.MathUtils.lerp(prev, targetX, delta * lerpSpeed));

    // Handle Physics
    if (powerUp === PowerUpType.JETPACK) {
      setYPos((prev) => THREE.MathUtils.lerp(prev, 8, delta * 5));
    } else {
      if (yPos > 0 || yVelocity !== 0) {
        const jumpMult = powerUp === PowerUpType.SNEAKERS ? 1.8 : 1;
        const newYVel = yVelocity - GRAVITY * delta;
        const newYPos = Math.max(0, yPos + newYVel * delta);
        
        setYVelocity(newYVel);
        setYPos(newYPos);

        if (newYPos === 0) setYVelocity(0);
      } else if (isJumping && yPos === 0) {
          const jumpMult = powerUp === PowerUpType.SNEAKERS ? 1.5 : 1;
          setYVelocity(Math.sqrt(2 * GRAVITY * JUMP_HEIGHT * jumpMult));
      }
    }

    if (meshRef.current) {
      meshRef.current.position.set(currentX, yPos, 0);
      
      // Animations
      const time = state.clock.getElapsedTime();
      
      // Body Bobbing (Running)
      if (!isJumping && !isRolling && yPos === 0) {
        meshRef.current.position.y += Math.sin(time * speed * 0.8) * 0.1;
        meshRef.current.rotation.x = Math.sin(time * speed * 0.8) * 0.05;
        meshRef.current.rotation.z = Math.sin(time * speed * 0.4) * 0.05;
      }

      if (isRolling) {
          meshRef.current.rotation.x = time * 15;
          meshRef.current.scale.y = 0.5;
      } else {
          meshRef.current.scale.y = 1;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Character Visualization */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1, 4, 8]} />
        <meshStandardMaterial color={COLORS.PLAYER_HOODIE} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#fcd4b4" />
      </mesh>
      {/* Cap */}
      <group position={[0, 2.5, -0.1]} rotation={[0.2, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={COLORS.PLAYER_CAP} />
        </mesh>
        <mesh position={[0, 0.05, -0.4]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.4]} />
          <meshStandardMaterial color={COLORS.PLAYER_CAP} />
        </mesh>
      </group>
      {/* Hoverboard Visual */}
      {powerUp === PowerUpType.HOVERBOARD && (
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[1, 0.1, 2]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
        </mesh>
      )}
      {/* Jetpack Visual */}
      {powerUp === PowerUpType.JETPACK && (
        <group position={[0, 1.2, -0.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.8, 0.3]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <pointLight position={[0, -0.5, 0]} color="#ff6600" intensity={2} distance={3} />
        </group>
      )}
    </group>
  );
};

export default Player;
