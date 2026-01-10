import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { User } from '../types';
import { Button } from '../components/Button';
import { Check, Camera, User as UserIcon, Ticket, Phone, List, X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Declare canvas-confetti global type
declare global {
  interface Window {
    confetti: any;
  }
}

const WinnersModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { winners } = useStore();
    
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ y: "100%" }} 
                    animate={{ y: 0 }} 
                    exit={{ y: "100%" }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            中奖光荣榜
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-3">
                        {winners.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>暂无中奖者，大奖还在后头！</p>
                            </div>
                        ) : (
                            winners.map((winner, idx) => (
                                <div key={idx} className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-700/50">
                                    <div className="relative">
                                        <img src={winner.avatar} className="w-10 h-10 rounded-full object-cover border border-yellow-500/50" />
                                        <div className="absolute -top-1 -left-1 bg-yellow-500 text-[10px] text-black font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                            {winners.length - idx}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{winner.name}</p>
                                        <p className="text-xs text-slate-400">No. {winner.code}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const MobileClient = () => {
  const { addUser, users, currentPrize, winners, triggerInteraction } = useStore();
  const [hasJoined, setHasJoined] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar, setAvatar] = useState(`https://picsum.photos/seed/${Math.random()}/200`);
  const [myCode, setMyCode] = useState('');
  const [showWinners, setShowWinners] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneNumber) return;

    // Simulate backend generating a code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      phoneNumber,
      avatar,
      code,
      joinedAt: Date.now(),
    };

    addUser(newUser);
    setMyCode(code);
    setHasJoined(true);
  };

  const handleInteract = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    triggerInteraction();
    
    // Create local particles
    const btn = document.getElementById('interact-btn');
    if (btn) {
        btn.classList.add('scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 100);
    }
  };

  const isWinner = winners.find(w => w.code === myCode);

  // Trigger confetti when winning
  useEffect(() => {
    if (isWinner && window.confetti) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, [isWinner]);

  if (hasJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-between relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[100px]" />
        
        {/* Header Actions */}
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={() => setShowWinners(true)}
                className="bg-slate-800/50 backdrop-blur-md p-3 rounded-full border border-slate-700 shadow-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
                <List className="w-6 h-6" />
            </button>
        </div>

        <div className="w-full max-w-md z-10 text-center space-y-8 mt-12 flex-1 flex flex-col justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <img src={avatar} alt="Me" className="relative w-32 h-32 rounded-full border-4 border-slate-900 shadow-2xl object-cover z-10" />
              <div className="absolute bottom-0 right-0 z-20 bg-green-500 rounded-full p-1.5 border-4 border-slate-950 shadow-sm">
                <Check className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 mt-2 text-xs text-slate-400">
                <span>{phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <span className="text-green-400">已签到</span>
            </div>
            
            <div className="mt-10 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl p-8 w-full shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
               <div className="absolute -right-6 -top-6 text-slate-800 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                 <Ticket className="w-40 h-40" />
               </div>
               
               <p className="text-blue-400 text-xs uppercase tracking-[0.2em] font-bold mb-3 relative z-10">Lottery Number</p>
               <div className="text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 tracking-widest drop-shadow-2xl relative z-10">
                 {myCode}
               </div>
               <div className="mt-4 flex justify-center">
                   <div className="h-1 w-12 bg-blue-500 rounded-full opacity-50"></div>
               </div>
            </div>
          </motion.div>

          {isWinner ? (
             <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-500 to-orange-600 p-8 rounded-3xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] border border-yellow-400/30 relative overflow-hidden mt-8"
             >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase italic">Big Winner!</h3>
                  <div className="h-px w-full bg-white/30 my-4"></div>
                  <p className="text-yellow-100 font-bold text-sm mb-1 uppercase tracking-wider">You Won</p>
                  <p className="text-2xl font-bold text-white leading-tight">{currentPrize.name}</p>
                </div>
             </motion.div>
          ) : (
             <div className="w-full mt-8">
                <Button 
                    id="interact-btn" 
                    onClick={handleInteract} 
                    className="w-full py-5 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/40 rounded-2xl border border-blue-400/20 active:scale-95 transition-all relative overflow-hidden group"
                >
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   <div className="relative flex items-center justify-center gap-2">
                       <span>👋</span> 
                       <span>向大屏招手</span>
                   </div>
                </Button>
                <p className="text-slate-500 text-xs mt-4 animate-pulse">大屏正在寻找幸运儿...</p>
             </div>
          )}
        </div>

        <div className="text-slate-700 text-[10px] z-10 font-mono mt-8 uppercase tracking-widest">Nebula System ID: {myCode}</div>
        
        <WinnersModal isOpen={showWinners} onClose={() => setShowWinners(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-black text-white mb-2 tracking-tighter">签到 <span className="text-blue-500">.ING</span></h1>
          <p className="text-slate-400 text-sm">Join the Nebula Interactive Event</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Avatar</label>
            <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <img src={avatar} alt="Preview" className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-slate-700" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(`https://picsum.photos/seed/${Math.random()}/200`)} className="text-blue-400 hover:text-blue-300">
                 <Camera className="w-4 h-4 mr-2" />
                 随机更换
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Nickname</label>
            <div className="relative group">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="请输入您的姓名"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone</label>
            <div className="relative group">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="请输入手机号"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20 rounded-xl mt-4">
            立即签到入场
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MobileClient;