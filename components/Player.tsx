
import React, { useRef, useState } from 'react';
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
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  
  const [yPos, setYPos] = useState(0);
  const [yVelocity, setYVelocity] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  useFrame((state, delta) => {
    const targetX = lane * LANE_WIDTH;
    const lerpSpeed = 10;
    setCurrentX((prev) => THREE.MathUtils.lerp(prev, targetX, delta * lerpSpeed));

    // Physics
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

    if (groupRef.current) {
      groupRef.current.position.set(currentX, yPos, 0);
      const time = state.clock.getElapsedTime();
      
      const isHovering = powerUp === PowerUpType.HOVERBOARD;

      // Body Rotations for "Surfing Pose" or "Running"
      if (isHovering) {
        // Leaning into a surfing pose
        bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, 0.5, delta * 10);
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0.2, delta * 10);
        
        // Dynamic arm balancing
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1, delta * 10);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 1, delta * 10);
        
        // Head looking forward but slightly defiant
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.PI - 0.3, delta * 10);
      } else {
        // Running pose
        bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, Math.PI, delta * 10);
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, delta * 10);
        
        const runCycle = Math.sin(time * speed * 0.8);
        leftArmRef.current.rotation.x = runCycle * 0.8;
        rightArmRef.current.rotation.x = -runCycle * 0.8;
        
        // Mischievous look over shoulder
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.PI + 0.5, delta * 5);
      }

      // Roll animation
      if (isRolling) {
        groupRef.current.rotation.x = time * 15;
        groupRef.current.scale.setScalar(0.7);
      } else {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, delta * 10));
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef} rotation={[0, Math.PI, 0]}>
        {/* Base Layer: Red T-shirt Glimpse */}
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color={COLORS.PLAYER_SHIRT} />
        </mesh>

        {/* Middle Layer: Cream Hoodie */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.5]} />
          <meshStandardMaterial color={COLORS.PLAYER_HOODIE} roughness={0.8} />
        </mesh>
        
        {/* Hoodie Hood (pulled down) */}
        <mesh position={[0, 1.7, -0.25]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.7, 0.4, 0.2]} />
          <meshStandardMaterial color={COLORS.PLAYER_HOODIE} />
        </mesh>

        {/* Outer Layer: Light Blue Sleeveless Denim Vest */}
        <mesh position={[0, 1.2, 0.05]} castShadow>
          <boxGeometry args={[0.85, 0.9, 0.55]} />
          <meshStandardMaterial color={COLORS.PLAYER_VEST} />
        </mesh>
        {/* Popped Collar */}
        <mesh position={[0, 1.75, 0.1]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.9, 0.2, 0.1]} />
          <meshStandardMaterial color={COLORS.PLAYER_VEST} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.5, 1.6, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial color={COLORS.PLAYER_HOODIE} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.5, 1.6, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial color={COLORS.PLAYER_HOODIE} />
          </mesh>
        </group>

        {/* Head */}
        <group ref={headRef} position={[0, 2.1, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color={COLORS.PLAYER_SKIN} roughness={0.3} />
          </mesh>
          
          {/* Large Expressive Brown Eyes */}
          <group position={[0, 0.1, 0.3]}>
             <mesh position={[-0.12, 0, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#4b2c20" />
             </mesh>
             <mesh position={[0.12, 0, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#4b2c20" />
             </mesh>
          </group>
          
          {/* Mischievous Smirk */}
          <mesh position={[0, -0.1, 0.32]} rotation={[0, 0, 0.1]}>
             <boxGeometry args={[0.15, 0.02, 0.01]} />
             <meshStandardMaterial color="#000" />
          </mesh>

          {/* Backward Cap */}
          <group position={[0, 0.15, 0]} rotation={[0.2, 0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={COLORS.PLAYER_CAP} />
            </mesh>
            {/* White Front Panel */}
            <mesh position={[0, 0.1, -0.3]} rotation={[Math.PI, 0, 0]}>
               <sphereGeometry args={[0.365, 16, 8, 0, Math.PI, 0, Math.PI / 3]} />
               <meshStandardMaterial color={COLORS.PLAYER_CAP_FRONT} />
            </mesh>
            {/* Bill facing backward */}
            <mesh position={[0, 0, -0.4]} castShadow>
              <boxGeometry args={[0.5, 0.04, 0.4]} />
              <meshStandardMaterial color={COLORS.PLAYER_CAP} />
            </mesh>
          </group>
        </group>

        {/* Lower Body: Slim-fit Medium-wash Jeans */}
        <group position={[0, 0, 0]}>
           <mesh position={[-0.2, 0.4, 0]} castShadow>
              <boxGeometry args={[0.3, 0.9, 0.35]} />
              <meshStandardMaterial color={COLORS.PLAYER_JEANS} />
           </mesh>
           <mesh position={[0.2, 0.4, 0]} castShadow>
              <boxGeometry args={[0.3, 0.9, 0.35]} />
              <meshStandardMaterial color={COLORS.PLAYER_JEANS} />
           </mesh>
           {/* Bunching at ankles */}
           <mesh position={[-0.2, 0.1, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.2, 8]} />
              <meshStandardMaterial color={COLORS.PLAYER_JEANS} />
           </mesh>
           <mesh position={[0.2, 0.1, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.2, 8]} />
              <meshStandardMaterial color={COLORS.PLAYER_JEANS} />
           </mesh>
        </group>

        {/* Footwear: Oversized Chunky White Sneakers with Blue Accents */}
        <group position={[0, -0.1, 0.1]}>
           <group position={[-0.22, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.35, 0.4, 0.6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.05, 0.1]}>
                <boxGeometry args={[0.36, 0.1, 0.4]} />
                <meshStandardMaterial color="#1a5276" />
              </mesh>
           </group>
           <group position={[0.22, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.35, 0.4, 0.6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.05, 0.1]}>
                <boxGeometry args={[0.36, 0.1, 0.4]} />
                <meshStandardMaterial color="#1a5276" />
              </mesh>
           </group>
        </group>
      </group>

      {/* Futuristic Hoverboard */}
      {powerUp === PowerUpType.HOVERBOARD && (
        <group position={[0, -0.4, 0]}>
          {/* Main Deck with Red/Yellow Stripes */}
          <mesh receiveShadow>
            <boxGeometry args={[1.4, 0.1, 2.8]} />
            <meshStandardMaterial color={COLORS.HOVERBOARD_STRIPE2} />
          </mesh>
          <mesh position={[0, 0.01, 0.7]}>
            <boxGeometry args={[1.4, 0.1, 0.4]} />
            <meshStandardMaterial color={COLORS.HOVERBOARD_STRIPE1} />
          </mesh>
          <mesh position={[0, 0.01, -0.7]}>
            <boxGeometry args={[1.4, 0.1, 0.4]} />
            <meshStandardMaterial color={COLORS.HOVERBOARD_STRIPE1} />
          </mesh>
          
          {/* Glowing Orange Under-rim */}
          <mesh position={[0, -0.06, 0]}>
             <boxGeometry args={[1.42, 0.05, 2.82]} />
             <meshStandardMaterial 
                color={COLORS.HOVERBOARD_GLOW} 
                emissive={COLORS.HOVERBOARD_GLOW} 
                emissiveIntensity={4} 
             />
          </mesh>
          
          {/* Rim Light */}
          <pointLight position={[0, -0.5, 0]} color={COLORS.HOVERBOARD_GLOW} intensity={2} distance={3} />
        </group>
      )}
    </group>
  );
};

export default Player;
