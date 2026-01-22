
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, PowerUpType, ObstacleData, CoinData, PowerUpData } from './types';
import { BASE_SPEED, ACCELERATION, COLORS } from './constants';
import Player from './components/Player';
import World from './components/World';
import UI from './components/UI';
import Antagonists from './components/Antagonists';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [lane, setLane] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [powerUp, setPowerUp] = useState<PowerUpType>(PowerUpType.NONE);
  const [powerUpTime, setPowerUpTime] = useState(0);
  
  // Chase Mechanic State
  const [chaseDistance, setChaseDistance] = useState(10);
  const [isStumbling, setIsStumbling] = useState(false);

  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [coinsList, setCoinsList] = useState<CoinData[]>([]);
  const [powerUpsList, setPowerUpsList] = useState<PowerUpData[]>([]);

  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const spawnBatch = useCallback((startZ: number) => {
    const newObstacles: ObstacleData[] = [];
    const newCoins: CoinData[] = [];
    const newPowerUps: PowerUpData[] = [];

    for (let i = 0; i < 5; i++) {
        const z = startZ + i * 30 + Math.random() * 10;
        const l = Math.floor(Math.random() * 3) - 1;
        const types: Array<'TRAIN' | 'BARRIER' | 'SCAFFOLD' | 'MOVING_TRAIN'> = ['TRAIN', 'BARRIER', 'SCAFFOLD', 'MOVING_TRAIN'];
        newObstacles.push({
            id: Math.random().toString(),
            type: types[Math.floor(Math.random() * types.length)],
            lane: l,
            z: z
        });

        for (let j = 0; j < 3; j++) {
            newCoins.push({
                id: Math.random().toString(),
                lane: l,
                z: z + 2 + j * 2
            });
        }

        if (Math.random() > 0.9) {
            const puTypes = [PowerUpType.HOVERBOARD, PowerUpType.JETPACK, PowerUpType.SNEAKERS, PowerUpType.MAGNET];
            newPowerUps.push({
                id: Math.random().toString(),
                type: puTypes[Math.floor(Math.random() * puTypes.length)],
                lane: (l + 1) % 3 - 1,
                z: z + 5
            });
        }
    }

    setObstacles(prev => [...prev.filter(o => o.z - score > -50), ...newObstacles]);
    setCoinsList(prev => [...prev.filter(c => c.z - score > -50), ...newCoins]);
    setPowerUpsList(prev => [...prev.filter(p => p.z - score > -50), ...newPowerUps]);
  }, [score]);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setCoins(0);
    setSpeed(BASE_SPEED);
    setLane(0);
    setPowerUp(PowerUpType.NONE);
    setPowerUpTime(0);
    setChaseDistance(10);
    setIsStumbling(false);
    setObstacles([]);
    setCoinsList([]);
    setPowerUpsList([]);
    spawnBatch(50);
    lastTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Swapped lane logic to invert 'Left' and 'Right' as per request
      // A/Left Arrow -> now decrements lane
      // D/Right Arrow -> now increments lane
      if (e.key === 'a' || e.key === 'ArrowLeft') setLane(prev => Math.max(-1, prev - 1));
      if (e.key === 'd' || e.key === 'ArrowRight') setLane(prev => Math.min(1, prev + 1));
      
      if (e.key === 'w' || e.key === 'ArrowUp') {
        if (!isJumping) {
            setIsJumping(true);
            setTimeout(() => setIsJumping(false), 800);
        }
      }
      if (e.key === 's' || e.key === 'ArrowDown') {
        if (!isRolling) {
            setIsRolling(true);
            setTimeout(() => setIsRolling(false), 800);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping, isRolling]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const tick = (time: number) => {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const effectiveSpeed = isStumbling ? speed * 0.5 : speed;
        setScore(prev => prev + effectiveSpeed * delta);
        setSpeed(prev => prev + ACCELERATION * delta);
        
        // Recover chase distance slowly
        setChaseDistance(prev => Math.min(10, prev + delta * 0.5));

        if (powerUpTime > 0) {
            setPowerUpTime(prev => {
                const next = prev - delta;
                if (next <= 0) {
                    setPowerUp(PowerUpType.NONE);
                    return 0;
                }
                return next;
            });
        }

        spawnTimerRef.current += delta * effectiveSpeed;
        if (spawnTimerRef.current > 100) {
            spawnBatch(score + 250);
            spawnTimerRef.current = 0;
        }

        gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, speed, powerUpTime, spawnBatch, score, isStumbling]);

  const handleCollision = (type: string) => {
      if (powerUp === PowerUpType.HOVERBOARD) {
          setPowerUp(PowerUpType.NONE);
          setPowerUpTime(0);
          return;
      }

      // Solid hits are immediate game over
      if (type === 'TRAIN' || type === 'MOVING_TRAIN') {
        setGameState(GameState.GAMEOVER);
        return;
      }

      // Soft hits reduce chase distance
      if (type === 'BARRIER' || type === 'SCAFFOLD') {
          if (!isStumbling) {
            setIsStumbling(true);
            setChaseDistance(prev => {
                const next = prev - 4;
                if (next <= 1) setGameState(GameState.GAMEOVER);
                return next;
            });
            setTimeout(() => setIsStumbling(false), 1000);
          }
      }
  };

  const handleCoinCollect = (id: string) => {
      setCoins(prev => prev + 1);
      setCoinsList(prev => prev.filter(c => c.id !== id));
  };

  const handlePowerUpCollect = (id: string, type: PowerUpType) => {
      setPowerUp(type);
      setPowerUpTime(10);
      setPowerUpsList(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <Canvas shadows>
        {/* Camera looking at positive Z (rotated PI around Y) */}
        <PerspectiveCamera makeDefault position={[0, 5, -8]} rotation={[-0.2, Math.PI, 0]} fov={75} />
        
        <ambientLight intensity={0.4} color={COLORS.GOLDEN_HOUR} />
        <directionalLight 
          position={[15, 8, 20]} 
          intensity={2} 
          color={COLORS.GOLDEN_HOUR} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        <Sky sunPosition={[100, 10, 100]} turbidity={10} rayleigh={2} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {gameState !== GameState.MENU && (
          <>
            <Player 
                lane={lane} 
                isJumping={isJumping} 
                isRolling={isRolling} 
                powerUp={powerUp}
                speed={speed}
                onCollision={handleCollision}
            />
            <Antagonists 
                playerLane={lane}
                chaseDistance={chaseDistance}
                speed={speed}
            />
            <World 
                speed={speed} 
                score={score}
                gameState={gameState}
                obstacles={obstacles} 
                coins={coinsList}
                powerUps={powerUpsList}
                playerLane={lane}
                isJumping={isJumping}
                isRolling={isRolling}
                currentPowerUp={powerUp}
                onCollision={handleCollision}
                onCoinCollect={handleCoinCollect}
                onPowerUpCollect={handlePowerUpCollect}
            />
          </>
        )}
        
        <Environment preset="city" />
      </Canvas>

      <UI 
        score={score} 
        coins={coins} 
        gameState={gameState} 
        onStart={startGame} 
        powerUp={powerUp}
        powerUpTime={powerUpTime}
      />

      {/* Screen Effects */}
      {gameState === GameState.PLAYING && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isStumbling ? 'opacity-50' : 'opacity-0'}`}>
           <div className="absolute inset-0 bg-red-900/30 blur-xl"></div>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full opacity-30 mix-blend-overlay bg-[radial-gradient(circle,_transparent_40%,_white_100%)]"></div>
          {speed > 25 && (
            <div className="absolute inset-0 animate-pulse bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')] opacity-10"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
