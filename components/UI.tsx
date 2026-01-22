
import React from 'react';
import { GameState, PowerUpType } from '../types';

interface UIProps {
  score: number;
  coins: number;
  gameState: GameState;
  powerUp: PowerUpType;
  powerUpTime: number;
  onStart: () => void;
}

const UI: React.FC<UIProps> = ({ score, coins, gameState, powerUp, powerUpTime, onStart }) => {
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50">
        <h1 className="text-6xl font-black text-white italic tracking-tighter mb-8 transform -skew-x-12">
          URBAN <span className="text-yellow-400">DASH</span>
        </h1>
        <p className="text-white mb-8 text-xl opacity-80">Golden Hour Run</p>
        <button 
          onClick={onStart}
          className="px-12 py-4 bg-yellow-400 text-black font-bold text-2xl rounded-full hover:bg-yellow-300 transition-all hover:scale-105"
        >
          PLAY NOW
        </button>
        <div className="mt-12 text-white/60 text-sm flex gap-8">
            <p>AD / Left-Right Arrows: Switch Lanes</p>
            <p>W / Up: Jump</p>
            <p>S / Down: Roll</p>
            <p>Space: Hoverboard</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAMEOVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/40 backdrop-blur-sm z-50">
        <h1 className="text-8xl font-black text-white mb-4">BUSTED!</h1>
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <p className="text-gray-500 font-bold text-lg mb-2">FINAL SCORE</p>
            <p className="text-6xl font-black text-black mb-6">{Math.floor(score)}</p>
            <div className="flex gap-4 mb-8">
                <div className="text-center">
                    <p className="text-gray-400 text-xs uppercase">Coins</p>
                    <p className="text-xl font-bold">{coins}</p>
                </div>
            </div>
            <button 
                onClick={onStart}
                className="w-full px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
                TRY AGAIN
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
      <div className="flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Score</p>
          <p className="text-white text-4xl font-black">{Math.floor(score)}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-[0_0_10px_rgba(255,204,0,0.5)]"></div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Coins</p>
            <p className="text-white text-3xl font-black">{coins}</p>
          </div>
        </div>
      </div>

      {powerUp !== PowerUpType.NONE && (
        <div className="mb-8 self-center bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
          <p className="text-white font-black text-sm uppercase tracking-tighter">
            {powerUp} ACTIVATED: <span className="text-yellow-400">{Math.ceil(powerUpTime)}s</span>
          </p>
          <div className="w-full h-1 bg-white/20 mt-1 rounded-full overflow-hidden">
            <div 
                className="h-full bg-yellow-400 transition-all duration-100" 
                style={{ width: `${(powerUpTime / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UI;
