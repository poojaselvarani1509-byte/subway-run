
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_WIDTH } from '../constants';

interface AntagonistsProps {
  playerLane: number;
  chaseDistance: number;
  speed: number;
}

const Antagonists: React.FC<AntagonistsProps> = ({ playerLane, chaseDistance, speed }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const [currentX, setCurrentX] = React.useState(0);

  useFrame((state, delta) => {
    const targetX = playerLane * LANE_WIDTH;
    setCurrentX((prev) => THREE.MathUtils.lerp(prev, targetX, delta * 5));

    if (groupRef.current) {
      // Stay behind at chaseDistance
      groupRef.current.position.set(currentX, 0, -chaseDistance);
      
      const time = state.clock.getElapsedTime();
      // Running animation bob
      groupRef.current.position.y = Math.abs(Math.sin(time * 12)) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Inspector */}
      <group position={[0.5, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <capsuleGeometry args={[0.5, 0.8, 4, 8]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#fcd4b4" />
        </mesh>
        {/* Badge */}
        <mesh position={[0.2, 1.4, 0.4]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="gold" metalness={1} />
        </mesh>
      </group>

      {/* The Guard Dog (Pit Bull) */}
      <group position={[-0.8, 0, 0.5]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.5, 0.8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0, 0.8, 0.4]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Tail */}
        <mesh position={[0, 0.5, -0.4]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>
    </group>
  );
};

export default Antagonists;
