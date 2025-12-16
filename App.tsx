import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, AIVibe } from './types';
import { generateVibeQuote } from './services/geminiService';
import { Disc3, Play, RotateCcw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [aiText, setAiText] = useState<AIVibe>({ quote: "I N I T I A L I Z I N G . . .", mood: "neon" });
  const [loadingAI, setLoadingAI] = useState(false);

  // Sound effects logic (mocked via console/visuals as we can't load mp3s easily)
  
  const fetchQuote = useCallback(async (context: 'start' | 'crash' | 'driving') => {
      setLoadingAI(true);
      const vibe = await generateVibeQuote(context);
      setAiText(vibe);
      setLoadingAI(false);
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    fetchQuote('start');
  };

  const handleCrash = () => {
    setGameState(GameState.GAME_OVER);
    if (score > highScore) {
        setHighScore(score);
    }
    fetchQuote('crash');
  };

  // Periodic AI commentary while driving
  useEffect(() => {
    let interval: any;
    if (gameState === GameState.PLAYING) {
        interval = setInterval(() => {
            // 20% chance every 10 seconds to get a new quote
            if(Math.random() > 0.8) {
                fetchQuote('driving');
            }
        }, 10000);
    }
    return () => clearInterval(interval);
  }, [gameState, fetchQuote]);

  useEffect(() => {
      // Initial greeting
      fetchQuote('start');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden select-none">
      {/* 3D Background / Game Layer */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        setScore={setScore} 
        onCrash={handleCrash}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header HUD */}
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
                <h1 className="retro-text text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse">
                    NEON HORIZON
                </h1>
                <div className="flex items-center gap-2 text-pink-300 font-mono text-sm opacity-80 bg-black/50 p-1 rounded backdrop-blur-sm w-fit">
                    <Disc3 size={16} className="animate-spin-slow" />
                    <span>NOW PLAYING: INFINITY.MP3</span>
                </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
                <div className="retro-text text-yellow-400 text-2xl md:text-4xl drop-shadow-[2px_2px_0_rgba(255,0,255,0.5)]">
                    SCORE: {score.toString().padStart(6, '0')}
                </div>
                <div className="text-cyan-300 font-mono text-sm">HI-SCORE: {highScore.toString().padStart(6, '0')}</div>
            </div>
        </div>

        {/* Center Menus (Pointer events enabled for buttons) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            
            {/* Main Menu */}
            {gameState === GameState.MENU && (
                <div className="bg-black/80 border-2 border-cyan-500 p-8 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.5)] pointer-events-auto text-center transform transition-all hover:scale-105 duration-300">
                    <h2 className="text-white font-bold text-xl mb-6 tracking-widest border-b border-pink-500 pb-2">SYSTEM READY</h2>
                    <button 
                        onClick={startGame}
                        className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-none focus:outline-none"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity"></span>
                        <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 opacity-30 group-hover:rotate-90 ease"></span>
                        <span className="relative text-white font-bold text-lg flex items-center gap-2 retro-text">
                            <Play size={20} /> DRIVE
                        </span>
                    </button>
                    <div className="mt-4 text-xs text-gray-400 font-mono">
                        ARROWS or A/D to STEER
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === GameState.GAME_OVER && (
                <div className="bg-black/90 border-2 border-red-500 p-10 rounded-lg backdrop-blur-md shadow-[0_0_30px_rgba(255,0,0,0.4)] pointer-events-auto text-center">
                    <h2 className="retro-text text-red-500 text-4xl mb-2 animate-pulse">CRASHED</h2>
                    <p className="text-gray-300 font-mono mb-6">SIMULATION TERMINATED</p>
                    
                    <div className="text-yellow-400 text-2xl mb-8 border-2 border-yellow-400/30 p-2 rounded">
                        FINAL SCORE: {score}
                    </div>

                    <button 
                        onClick={startGame}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-all retro-text text-sm"
                    >
                        <RotateCcw size={18} /> REBOOT SYSTEM
                    </button>
                </div>
            )}
        </div>

        {/* Footer / AI Log */}
        <div className="w-full max-w-2xl mx-auto pointer-events-none">
            <div className={`
                relative p-4 rounded-t-lg backdrop-blur-sm border-t border-x border-pink-500/30
                bg-gradient-to-t from-purple-900/50 to-transparent
                transition-all duration-500 ease-in-out
                ${loadingAI ? 'opacity-50' : 'opacity-100'}
            `}>
                <div className="absolute -top-3 left-4 bg-black px-2 text-xs text-pink-500 font-bold border border-pink-500/50 flex items-center gap-1">
                    <Zap size={10} /> AI DJ
                </div>
                <p className="text-cyan-100 font-mono text-center md:text-lg leading-relaxed drop-shadow-md">
                   "{aiText.quote}"
                </p>
                {loadingAI && (
                    <div className="absolute bottom-1 right-2 flex gap-1">
                        <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}
            </div>
        </div>

      </div>
      
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,20,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-40 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
    </div>
  );
};

export default App;