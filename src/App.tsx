/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Gamepad2, Trophy, RefreshCw } from 'lucide-react';

// --- Types ---
interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  color: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "VOID_RUNNER.EXE",
    artist: "CYBER_GHOST",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#00f3ff"
  },
  {
    id: 2,
    title: "NEON_PULSE.SYS",
    artist: "SYNTH_STORM",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#ff00ff"
  },
  {
    id: 3,
    title: "GLITCH_CORE.DAT",
    artist: "NULL_POINTER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#fff200"
  }
];

// --- Components ---

export default function App() {
  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameStarted, setGameStarted] = useState(false);

  // --- Music Logic ---
  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(e => console.error("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = dir === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || !gameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setIsGameOver(true);
        setGameStarted(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(50, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, gameStarted, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === ' ') {
        resetGame();
        return;
      }
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameStarted]);

  useEffect(() => {
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [moveSnake, speed]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-void-black">
      {/* Visual Overlays */}
      <div className="crt-overlay" />
      <div className="scanline" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 mb-8 text-center"
      >
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter glitch-text uppercase italic">
          NEON_VOID // SYSTEM_ONLINE
        </h1>
        <p className="text-xs text-neon-cyan opacity-70 mt-2 font-mono">
          [STATUS: {gameStarted ? 'ACTIVE_SIMULATION' : 'IDLE_STATE'}] [FREQ: 44.1KHZ]
        </p>
      </motion.header>

      <main className="z-10 flex flex-col lg:flex-row gap-8 items-center lg:items-start max-w-6xl w-full">
        
        {/* Left Panel: Music Player */}
        <motion.section 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-80 flex flex-col gap-4"
        >
          <div className="neon-border p-6 bg-void-black/80 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan animate-pulse" />
            
            <div className="flex items-center gap-2 mb-6 text-neon-cyan">
              <Music size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Audio_Processor</span>
            </div>

            <div className="aspect-square w-full mb-6 bg-black/50 flex items-center justify-center relative border border-neon-cyan/20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack.id}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.2, opacity: 0, rotate: 10 }}
                  className="w-48 h-48 flex items-center justify-center"
                  style={{ color: currentTrack.color }}
                >
                  <div className="relative">
                    <div className={`absolute inset-0 blur-xl opacity-30 animate-pulse`} style={{ backgroundColor: currentTrack.color }} />
                    <Music size={120} strokeWidth={1} />
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Visualizer Mock */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between h-12 gap-1">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [10, 40, 20, 45, 15] : 5 }}
                    transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                    className="w-full bg-neon-cyan/40"
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
              <p className="text-sm text-neon-cyan opacity-60 font-mono italic">{currentTrack.artist}</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button onClick={() => skipTrack('prev')} className="p-2 hover:text-neon-magenta transition-colors">
                <SkipBack size={24} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full border-2 border-neon-cyan flex items-center justify-center hover:bg-neon-cyan hover:text-void-black transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={() => skipTrack('next')} className="p-2 hover:text-neon-magenta transition-colors">
                <SkipForward size={24} />
              </button>
            </div>

            <audio 
              ref={audioRef} 
              src={currentTrack.url} 
              onEnded={() => skipTrack('next')}
            />
          </div>

          <div className="neon-border p-4 bg-void-black/80 text-[10px] font-mono opacity-60">
            <p className="mb-1">SYSTEM_LOG: TRACK_LOADED_SUCCESSFULLY</p>
            <p className="mb-1">BUFFERING: 100%</p>
            <p>LATENCY: 12ms</p>
          </div>
        </motion.section>

        {/* Center: Snake Game */}
        <motion.section 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="relative neon-border-magenta p-2 bg-black shadow-[0_0_30px_rgba(255,0,255,0.2)]">
            {/* Game Header */}
            <div className="absolute -top-10 left-0 right-0 flex justify-between items-end px-2">
              <div className="flex items-center gap-2 text-neon-magenta">
                <Trophy size={16} />
                <span className="text-sm font-bold tracking-tighter">SCORE: {score.toString().padStart(4, '0')}</span>
              </div>
              <div className="text-neon-cyan/50 text-[10px] font-mono">
                HI_SCORE: {highScore.toString().padStart(4, '0')}
              </div>
            </div>

            {/* Game Canvas/Grid */}
            <div 
              className="grid bg-void-black relative overflow-hidden"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'min(80vw, 500px)',
                height: 'min(80vw, 500px)'
              }}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 pointer-events-none opacity-5">
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-neon-cyan" />
                ))}
              </div>

              {/* Snake */}
              {snake.map((segment, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    backgroundColor: i === 0 ? '#ff00ff' : '#00f3ff',
                    boxShadow: i === 0 ? '0 0 10px #ff00ff' : '0 0 5px #00f3ff',
                    zIndex: 10,
                    borderRadius: i === 0 ? '2px' : '0'
                  }}
                />
              ))}

              {/* Food */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute bg-neon-yellow"
                style={{
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  boxShadow: '0 0 15px #fff200',
                  zIndex: 5
                }}
              />

              {/* Overlays */}
              <AnimatePresence>
                {!gameStarted && !isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void-black/90 backdrop-blur-sm"
                  >
                    <Gamepad2 size={48} className="text-neon-magenta mb-4 animate-bounce" />
                    <h3 className="text-2xl font-black italic mb-2">INITIALIZE_VOID</h3>
                    <p className="text-xs text-neon-cyan opacity-70 mb-6 font-mono">PRESS [SPACE] OR CLICK TO START</p>
                    <button 
                      onClick={resetGame}
                      className="px-8 py-3 neon-border hover:bg-neon-cyan hover:text-void-black transition-all font-bold tracking-widest uppercase italic"
                    >
                      EXECUTE_RUN
                    </button>
                  </motion.div>
                )}

                {isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void-black/95 backdrop-blur-md"
                  >
                    <h3 className="text-4xl font-black italic mb-2 text-neon-magenta glitch-text">SYSTEM_CRASH</h3>
                    <p className="text-xl font-bold mb-6 text-white">FINAL_SCORE: {score}</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={resetGame}
                        className="flex items-center gap-2 px-6 py-3 neon-border-magenta hover:bg-neon-magenta hover:text-white transition-all font-bold tracking-widest uppercase italic"
                      >
                        <RefreshCw size={18} />
                        REBOOT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Controls Hint */}
          <div className="mt-6 flex gap-8 text-[10px] font-mono text-neon-cyan opacity-40">
            <div className="flex flex-col items-center">
              <div className="border border-neon-cyan p-1 mb-1">ARROWS</div>
              <span>NAVIGATION</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="border border-neon-cyan p-1 mb-1">SPACE</div>
              <span>RESTART</span>
            </div>
          </div>
        </motion.section>

        {/* Right Panel: Stats & Info */}
        <motion.section 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-64 flex flex-col gap-4"
        >
          <div className="neon-border p-4 bg-void-black/80">
            <h4 className="text-xs font-bold text-neon-magenta mb-4 uppercase tracking-widest border-b border-neon-magenta/20 pb-2">Hardware_Stats</h4>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span>CPU_LOAD</span>
                <span className="text-neon-cyan">{(Math.random() * 20 + 10).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-white/10">
                <motion.div 
                  animate={{ width: ['20%', '45%', '30%'] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-neon-cyan" 
                />
              </div>
              <div className="flex justify-between">
                <span>MEM_USAGE</span>
                <span className="text-neon-cyan">2.4GB / 16GB</span>
              </div>
              <div className="flex justify-between">
                <span>CORE_TEMP</span>
                <span className="text-neon-magenta">42°C</span>
              </div>
            </div>
          </div>

          <div className="neon-border p-4 bg-void-black/80">
            <h4 className="text-xs font-bold text-neon-cyan mb-4 uppercase tracking-widest border-b border-neon-cyan/20 pb-2">Void_Protocol</h4>
            <p className="text-[10px] leading-relaxed opacity-70 italic">
              "The void consumes all. Your only purpose is to grow, consume, and survive the frequencies. Do not hit the boundaries of your own existence."
            </p>
          </div>

          <div className="flex-1" />

          <div className="text-[9px] font-mono opacity-30 text-right">
            BUILD: v0.4.2-STABLE<br />
            KERNEL: NEON-OS-X<br />
            © 2026 VOID_INDUSTRIES
          </div>
        </motion.section>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-2 bg-black border-t border-neon-cyan/20 z-20 flex justify-between items-center text-[10px] font-mono">
        <div className="flex gap-4">
          <span className="text-neon-cyan animate-pulse">● LIVE_FEED</span>
          <span className="opacity-50">LOCATION: SECTOR_7G</span>
        </div>
        <div className="flex gap-4 items-center">
          <Volume2 size={12} className="text-neon-cyan" />
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-neon-cyan w-3/4" />
          </div>
          <span className="opacity-50">UTC: {new Date().toISOString().split('T')[1].split('.')[0]}</span>
        </div>
      </footer>
    </div>
  );
}
