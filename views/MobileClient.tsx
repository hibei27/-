import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { User } from '../types';
import { Button } from '../components/Button';
import { Check, Camera, User as UserIcon, Ticket, Phone, List, X, Trophy, MessageSquare, Send, Gift, Smartphone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Declare canvas-confetti global type
declare global {
  interface Window {
    confetti: any;
    DeviceMotionEvent: any;
  }
}

// Shake detection hook
const useShake = (onShake: () => void, enabled: boolean = true) => {
    const lastTime = useRef(0);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const lastZ = useRef(0);
    const lastShake = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        const handleMotion = (e: DeviceMotionEvent) => {
            const current = e.accelerationIncludingGravity;
            if (!current) return;

            const currentTime = Date.now();
            if ((currentTime - lastTime.current) > 100) {
                const diffTime = currentTime - lastTime.current;
                lastTime.current = currentTime;

                const x = current.x || 0;
                const y = current.y || 0;
                const z = current.z || 0;

                const speed = Math.abs(x + y + z - lastX.current - lastY.current - lastZ.current) / diffTime * 10000;

                if (speed > 1500) { // Threshold
                    const now = Date.now();
                    if (now - lastShake.current > 1000) { // Throttle 1s
                        lastShake.current = now;
                        onShake();
                    }
                }

                lastX.current = x;
                lastY.current = y;
                lastZ.current = z;
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [onShake, enabled]);
};

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

const BarrageModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) => {
    const { sendBarrage } = useStore();
    const [text, setText] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            sendBarrage(text.trim(), user);
            setText("");
            onClose();
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ y: "100%", opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: "100%", opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl pb-6"
                    onClick={e => e.stopPropagation()}
                >
                     <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            发送现场弹幕
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4">
                        <div className="relative">
                            <input 
                                autoFocus
                                value={text}
                                onChange={e => setText(e.target.value)}
                                maxLength={30}
                                placeholder="输入祝福或吐槽..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                                {text.length}/30
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>取消</Button>
                            <Button type="submit" className="flex-1" disabled={!text.trim()}>
                                <Send className="w-4 h-4 mr-2" />
                                发送
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center mt-4">文明发言，弹幕将实时显示在大屏上</p>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const MobileClient = () => {
  const { addUser, users, currentPrize, winners, triggerInteraction, barrageEnabled } = useStore();
  const [hasJoined, setHasJoined] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar, setAvatar] = useState(`https://picsum.photos/seed/${Math.random()}/200`);
  const [myCode, setMyCode] = useState('');
  const [showWinners, setShowWinners] = useState(false);
  const [showBarrage, setShowBarrage] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-login check (Session Persistence)
  useEffect(() => {
    const savedCode = localStorage.getItem('nebula_my_code');
    if (savedCode) {
        // Check if the user actually exists in the store (in case admin cleared users)
        const existingUser = users.find(u => u.code === savedCode);
        if (existingUser) {
            setMyCode(savedCode);
            setName(existingUser.name);
            setPhoneNumber(existingUser.phoneNumber || '');
            setAvatar(existingUser.avatar);
            setHasJoined(true);
        } else {
            // User ID exists in local storage but not in DB (cleared), reset local storage
            localStorage.removeItem('nebula_my_code');
        }
    }
  }, [users]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !phoneNumber) return;

    // 1. Phone Number Validation
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        setErrorMsg('请输入正确的11位手机号码');
        // Vibrate to indicate error
        if (navigator.vibrate) navigator.vibrate(200);
        return;
    }

    // 2. Check for duplicate phone number in global list
    const isDuplicatePhone = users.some(u => u.phoneNumber === phoneNumber);
    if (isDuplicatePhone) {
        setErrorMsg('该手机号已签到，请勿重复操作');
        return;
    }

    // 3. Check for existing session (One device per user rule)
    if (localStorage.getItem('nebula_my_code')) {
        setErrorMsg('当前设备已关联一个签到账号');
        return;
    }

    // Generate code
    let code = Math.floor(10000 + Math.random() * 90000).toString();
    // Ensure code uniqueness (simple retry)
    while (users.some(u => u.code === code)) {
        code = Math.floor(10000 + Math.random() * 90000).toString();
    }

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
    
    // Save session
    localStorage.setItem('nebula_my_code', code);
    
    // Attempt to request permission silently or set state to ask later (iOS 13+)
    if (typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
        // Needs explicit button click later
        setShakeEnabled(false); 
    } else {
        setShakeEnabled(true);
    }
  };

  const handleInteract = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    triggerInteraction();
    
    // Create local particles/feedback
    const btn = document.getElementById('interact-btn');
    if (btn) {
        btn.classList.add('scale-95', 'bg-blue-500');
        setTimeout(() => btn.classList.remove('scale-95', 'bg-blue-500'), 150);
    }
  }, [triggerInteraction]);

  // Enable Shake
  useShake(handleInteract, shakeEnabled);
  
  const enableShake = async () => {
      if (typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
          try {
              const response = await (window as any).DeviceMotionEvent.requestPermission();
              if (response === 'granted') {
                  setShakeEnabled(true);
                  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              }
          } catch (e) {
              console.error(e);
          }
      }
  }

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

  // Background Component to avoid layout shifts and scrolling issues
  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
    </div>
  );
  
  // Current user object helper
  const currentUser = users.find(u => u.code === myCode) || { name, avatar, code: myCode };

  if (hasJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative flex flex-col">
        <Background />
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <img src={avatar} className="w-10 h-10 rounded-full border border-slate-600" />
                <div>
                    <h2 className="font-bold text-sm leading-tight">{name}</h2>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wider">{myCode}</p>
                </div>
            </div>
            <div className="flex gap-2">
                {barrageEnabled && (
                    <button 
                        onClick={() => setShowBarrage(true)}
                        className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-blue-400 hover:bg-slate-700 transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                )}
                <button 
                    onClick={() => setShowWinners(true)}
                    className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-yellow-500 hover:bg-slate-700 transition-colors"
                >
                    <Trophy className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-safe">
            {/* Prize Card */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Gift className="w-3 h-3" /> 当前奖品
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 border border-slate-700 shadow-xl flex gap-4 items-center">
                    <img src={currentPrize.image} className="w-16 h-16 rounded-xl bg-slate-950 object-cover border border-slate-600" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate">{currentPrize.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">剩余数量: <span className="text-blue-400 font-mono font-bold">{currentPrize.count}</span></p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
              {isWinner ? (
                 <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-full bg-gradient-to-br from-yellow-500 to-orange-600 p-8 rounded-3xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] border border-yellow-400/30 relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic">Big Winner!</h3>
                      <p className="text-yellow-100 font-bold text-sm mb-4 uppercase tracking-wider">You Won</p>
                      <p className="text-2xl font-bold text-white leading-tight">{currentPrize.name}</p>
                    </div>
                 </motion.div>
              ) : (
                 <div className="w-full max-w-sm">
                    {/* Interaction Button */}
                    <div className="relative group">
                         {/* Ripple Effects */}
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-active:scale-110 transition-transform duration-300"></div>
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                        
                        <button 
                            id="interact-btn" 
                            onClick={() => {
                                handleInteract();
                                if(!shakeEnabled) enableShake();
                            }} 
                            className="relative w-full aspect-square rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-slate-700 shadow-2xl flex flex-col items-center justify-center gap-4 transition-all active:scale-95 active:border-blue-500 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent opacity-50"></div>
                            
                            <Smartphone className={`w-16 h-16 text-slate-400 transition-all duration-300 ${shakeEnabled ? 'animate-wiggle' : 'group-hover:scale-110 group-active:text-blue-400'}`} />
                            
                            <div className="text-center z-10">
                                <p className="text-xl font-bold text-white">{shakeEnabled ? "摇一摇!" : "点我互动"}</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{shakeEnabled ? "Shake Device" : "Tap to wave"}</p>
                            </div>
                        </button>
                    </div>
                    
                    {!shakeEnabled && (
                        <p className="text-center text-xs text-slate-500 mt-6">
                            提示: 点击按钮并允许权限即可启用“摇一摇”功能
                        </p>
                    )}
                 </div>
              )}
            </div>

            <div className="mt-6 text-center">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
                    <Ticket className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lottery Code</span>
                    <span className="text-blue-400 font-mono font-bold text-lg">{myCode}</span>
                 </div>
            </div>
        </div>
        
        <WinnersModal isOpen={showWinners} onClose={() => setShowWinners(false)} />
        <BarrageModal isOpen={showBarrage} onClose={() => setShowBarrage(false)} user={currentUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      <Background />
      
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 my-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
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
                onChange={(e) => { setPhoneNumber(e.target.value); setErrorMsg(''); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="请输入11位手机号"
                required
                maxLength={11}
              />
            </div>
          </div>
          
          {errorMsg && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
              </div>
          )}

          <Button type="submit" className="w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20 rounded-xl mt-4">
            立即签到入场
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MobileClient;