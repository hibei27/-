
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Users, Trophy, Play, Square, Settings, RefreshCw, Wand2, LogOut, Edit, Save, Crown, AlertTriangle, Shield, Eye, EyeOff, Plus, Trash2, Download, Search, CheckCircle, Volume2, Globe, Activity, LayoutGrid, MessageSquare, ChevronLeft, ChevronRight, UserPlus, XCircle, Palette, Lock, Key, X } from 'lucide-react';
import { generateCongratulatorySpeech, speakText } from '../services/geminiService';
import { Prize, AppTheme } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components for Auth ---

const LoginScreen = () => {
    const login = useStore(s => s.login);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            setError(false);
        } else {
            setError(true);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[100px]" />
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10"
             >
                 <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                         <Lock className="w-8 h-8 text-blue-400" />
                     </div>
                     <h1 className="text-2xl font-bold text-white mb-2">管理员登录</h1>
                     <p className="text-slate-400 text-sm">请输入访问密码</p>
                 </div>

                 <form onSubmit={handleLogin} className="space-y-4">
                     <div className="space-y-2">
                         <div className="relative group">
                             <Key className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                             <input 
                                 type="password" 
                                 autoFocus
                                 value={password}
                                 onChange={(e) => { setPassword(e.target.value); setError(false); }}
                                 className={`w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600 ${error ? 'border-red-500 shake' : 'border-slate-800'}`}
                                 placeholder="请输入密码"
                             />
                         </div>
                         {error && <p className="text-red-500 text-xs ml-1">密码错误，请重试</p>}
                     </div>

                     <Button type="submit" className="w-full py-3 text-lg font-bold shadow-lg shadow-blue-500/20 rounded-xl">
                         登录后台
                     </Button>
                 </form>
             </motion.div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const changePassword = useStore(s => s.changePassword);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 4) {
            setError("密码长度至少需4位");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        changePassword(newPassword);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        修改管理员密码
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-8 text-green-600">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-bold">密码修改成功</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">新密码</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="输入新密码"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">确认新密码</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="再次输入新密码"
                            />
                        </div>
                        
                        {error && (
                            <div className="text-red-500 text-xs flex items-center gap-1 bg-red-50 p-2 rounded">
                                <AlertTriangle className="w-3 h-3" /> {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <Button type="submit" className="w-full">确认修改</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
  const store = useStore();
  const { users, winners, status, currentPrize, prizes, setStatus, drawWinner, revealWinner, resetLottery, removeUser, updatePrize, presetWinnerId, setPresetWinner, selectPrize, addPrize, deletePrize, displayMode, setDisplayMode, barrageEnabled, setBarrageEnabled, generateMockUsers, clearAllUsers, theme, setTheme, isAuthenticated, logout } = store;
  
  const [speech, setSpeech] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPrize, setIsEditingPrize] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false); // Toggle for "God Mode"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Safe initialization even if currentPrize is missing
  const [tempPrizeName, setTempPrizeName] = useState(currentPrize?.name || "");
  const [tempPrizeImage, setTempPrizeImage] = useState(currentPrize?.image || "");

  // Update temp state when currentPrize changes
  useEffect(() => {
      if (currentPrize) {
          setTempPrizeName(currentPrize.name);
          setTempPrizeImage(currentPrize.image);
      }
  }, [currentPrize]);

  // New prize form
  const [newPrizeName, setNewPrizeName] = useState("");
  const [showAddPrize, setShowAddPrize] = useState(false);

  // --- Auth Check ---
  if (!isAuthenticated) {
      return <LoginScreen />;
  }
  
  // Safety check for corrupt state
  if (!currentPrize) {
      return (
          <div className="h-screen flex items-center justify-center flex-col gap-4 text-slate-800">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">数据状态异常</h2>
              <Button onClick={() => window.location.reload()}>刷新页面</Button>
              <Button variant="danger" onClick={() => { localStorage.clear(); window.location.reload(); }}>重置所有数据</Button>
          </div>
      )
  }

  const handleStartDraw = () => {
    setSpeech(""); // Clear previous speech
    setStatus('rolling');
  };

  const handleStopDraw = async () => {
    // 1. Determine winner and switch to 'exploded' state (Tension)
    drawWinner();
    
    // 2. Wait for explosion/convergence animation (e.g., 2 seconds)
    setTimeout(() => {
        // 3. Reveal the winner
        revealWinner();
    }, 2000);
  };

  const handleGenerateSpeech = async () => {
    if (winners.length === 0) return;
    setIsGenerating(true);
    const speechText = await generateCongratulatorySpeech(winners[0], currentPrize);
    setSpeech(speechText);
    setIsGenerating(false);
  };
  
  const handleSpeak = async () => {
      if (!speech) return;
      await speakText(speech);
  };

  const handleSavePrize = () => {
      updatePrize({ name: tempPrizeName, image: tempPrizeImage });
      setIsEditingPrize(false);
  };

  const handleAddPrize = () => {
    if(!newPrizeName) return;
    const newPrize: Prize = {
        id: crypto.randomUUID(),
        name: newPrizeName,
        count: 1,
        image: `https://picsum.photos/seed/${newPrizeName}/200/200`
    };
    addPrize(newPrize);
    setNewPrizeName("");
    setShowAddPrize(false);
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "\uFEFF" // BOM for Excel chinese support
        + "ID,用户昵称,手机号,签到时间,中奖码,是否中奖\n"
        + users.map(u => {
            const isWinner = winners.find(w => w.id === u.id);
            return `${u.id},${u.name},${u.phoneNumber || ''},${new Date(u.joinedAt).toLocaleString()},${u.code},${isWinner ? '是' : '否'}`;
        }).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nebula_users_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presetUser = presetWinnerId ? users.find(u => u.id === presetWinnerId) : null;
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.phoneNumber && u.phoneNumber.includes(searchTerm))
  );

  const ThemeButton = ({ id, color, label }: { id: AppTheme, color: string, label: string }) => (
      <button 
        onClick={() => setTheme(id)} 
        className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${theme === id ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        title={label}
      >
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          {!isSidebarCollapsed && <span className="text-xs font-bold">{label}</span>}
      </button>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 flex font-sans">
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col shrink-0 h-full z-10 transition-all duration-300 ease-in-out relative`}
      >
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="text-blue-500">❖</span> 星云后台
              </h2>
          )}
          {isSidebarCollapsed && <span className="text-blue-500 font-bold text-2xl">❖</span>}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`text-slate-500 hover:text-white transition-colors ${isSidebarCollapsed ? 'absolute -right-3 top-8 bg-slate-800 rounded-full p-1 border border-slate-700 shadow-md z-50' : ''}`}
            title={isSidebarCollapsed ? "展开侧栏" : "收起侧栏"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
          <div className={`flex items-center p-3 rounded-lg font-medium transition-all ${isSidebarCollapsed ? 'justify-center bg-blue-600/20 text-blue-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'}`} title="抽奖控制台">
            <Trophy className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
            {!isSidebarCollapsed && "抽奖控制台"}
          </div>
          <div className={`flex items-center p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`} title="用户列表">
            <Users className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
            {!isSidebarCollapsed && `用户列表 (${users.length})`}
          </div>
          
          <div className="pt-6 pb-2">
              {!isSidebarCollapsed && <h3 className="text-xs font-bold text-slate-500 uppercase px-3 mb-3 whitespace-nowrap">大屏视图模式</h3>}
              <div className={`grid gap-2 ${isSidebarCollapsed ? 'grid-cols-1 px-0' : 'grid-cols-3 px-3'}`}>
                 <button 
                    onClick={() => setDisplayMode('sphere')} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all ${displayMode === 'sphere' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="球体模式"
                 >
                    <Globe className="w-5 h-5" /> 
                    {!isSidebarCollapsed && <span className="text-[10px] font-bold">星球</span>}
                 </button>
                 <button 
                    onClick={() => setDisplayMode('helix')} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all ${displayMode === 'helix' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="螺旋模式"
                 >
                    <Activity className="w-5 h-5" /> 
                    {!isSidebarCollapsed && <span className="text-[10px] font-bold">螺旋</span>}
                 </button>
                 <button 
                    onClick={() => setDisplayMode('grid')} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all ${displayMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="网格模式"
                 >
                    <LayoutGrid className="w-5 h-5" /> 
                    {!isSidebarCollapsed && <span className="text-[10px] font-bold">网格</span>}
                 </button>
              </div>
          </div>
          
          <div className="pt-6 pb-2">
              {!isSidebarCollapsed && <h3 className="text-xs font-bold text-slate-500 uppercase px-3 mb-3 whitespace-nowrap">视觉主题</h3>}
              <div className={`space-y-1 ${isSidebarCollapsed ? 'px-0' : 'px-3'}`}>
                  <ThemeButton id="nebula" color="bg-blue-500" label="赛博星云" />
                  <ThemeButton id="festive" color="bg-red-500" label="新春庆典" />
                  <ThemeButton id="luxury" color="bg-yellow-500" label="黑金奢华" />
              </div>
          </div>
          
          {/* Feature Toggles */}
          <div className="pt-6 pb-2">
              {!isSidebarCollapsed && <h3 className="text-xs font-bold text-slate-500 uppercase px-3 mb-3 whitespace-nowrap">现场功能开关</h3>}
              <div className={`flex rounded-lg bg-slate-800/50 border border-slate-800 transition-all ${isSidebarCollapsed ? 'flex-col items-center p-2 gap-2 mx-0' : 'items-center justify-between p-3 mx-3'}`}>
                    <div className={`flex items-center text-slate-300 ${isSidebarCollapsed ? 'justify-center' : ''}`} title="现场弹幕">
                        <MessageSquare className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                        {!isSidebarCollapsed && <span className="text-sm">现场弹幕</span>}
                    </div>
                    {/* Toggle Switch */}
                    <button 
                        onClick={() => setBarrageEnabled(!barrageEnabled)}
                        className={`rounded-full relative transition-colors duration-300 focus:outline-none ${isSidebarCollapsed ? 'w-8 h-4' : 'w-10 h-5'} ${barrageEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                        title={barrageEnabled ? "关闭弹幕" : "开启弹幕"}
                    >
                        <div className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isSidebarCollapsed ? 'w-3 h-3' : 'w-4 h-4'} ${barrageEnabled ? (isSidebarCollapsed ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}`} />
                    </button>
              </div>
          </div>

          {/* Advanced Mode Toggle */}
          <div 
             onClick={() => setShowAdvanced(!showAdvanced)}
             className={`flex items-center p-3 rounded-lg cursor-pointer transition-all mt-4 border ${isSidebarCollapsed ? 'justify-center mx-0' : 'mx-3'} ${showAdvanced ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
             title="内定控制模式"
          >
            {showAdvanced ? <Eye className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} /> : <EyeOff className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />}
            {!isSidebarCollapsed && <span className="text-sm">内定控制模式</span>}
          </div>
        </nav>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
             <button 
                onClick={() => setShowPasswordModal(true)}
                className={`flex items-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="修改密码"
             >
                 <Settings className="w-5 h-5" />
                 {!isSidebarCollapsed && <span className="ml-3 text-sm">修改密码</span>}
             </button>
             <button 
                onClick={logout}
                className={`flex items-center p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="退出登录"
             >
                 <LogOut className="w-5 h-5" />
                 {!isSidebarCollapsed && <span className="ml-3 text-sm">退出登录</span>}
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative pb-32 transition-all duration-300">
        <header className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">活动现场控制</h1>
              <p className="text-slate-500 mt-1">管理抽奖流程与监控数据</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${status === 'rolling' ? 'bg-green-100 text-green-700 animate-pulse' : status === 'exploded' ? 'bg-purple-100 text-purple-700 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${status === 'rolling' ? 'bg-green-500' : status === 'exploded' ? 'bg-purple-500' : 'bg-slate-400'}`}></div>
              状态: {status === 'idle' ? '待机中' : status === 'rolling' ? '抽奖进行中' : status === 'exploded' ? '聚变中' : status === 'winner-revealed' ? '中奖展示' : status}
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">总参与人数</p>
            <p className="text-4xl font-mono mt-2 font-semibold text-slate-800">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">已产生中奖者</p>
            <p className="text-4xl font-mono mt-2 text-yellow-600 font-semibold">{winners.length}</p>
          </div>
          
          {/* Current Prize Status */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">当前进行中</p>
                <div className="flex justify-between items-start">
                    <p className="text-xl font-bold text-slate-900 truncate pr-2">{currentPrize.name}</p>
                    <button onClick={() => {
                        setIsEditingPrize(!isEditingPrize);
                        setTempPrizeName(currentPrize.name);
                        setTempPrizeImage(currentPrize.image);
                    }} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
                
                {isEditingPrize && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200 shadow-sm animate-in slide-in-from-top-2">
                         <input 
                            className="w-full text-sm border p-1 rounded mb-2" 
                            value={tempPrizeName} 
                            onChange={e => setTempPrizeName(e.target.value)} 
                        />
                        <div className="flex gap-2">
                             <Button size="sm" onClick={handleSavePrize}>保存</Button>
                             <Button size="sm" variant="ghost" onClick={() => setIsEditingPrize(false)}>取消</Button>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>剩余名额: <strong className="text-slate-900">{Math.max(0, currentPrize.count - 0)}</strong> / {currentPrize.count}</span>
                </div>
             </div>
             <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-100 -rotate-12" />
          </div>
        </div>
        
        {/* Prize Management Section */}
        <section className="mb-8">
             <div className="flex justify-between items-end mb-4">
                 <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                     <Settings className="w-5 h-5" /> 奖项配置
                 </h3>
                 <Button size="sm" variant="ghost" onClick={() => setShowAddPrize(!showAddPrize)}>
                    <Plus className="w-4 h-4 mr-1" /> 新增奖项
                 </Button>
             </div>
             
             {showAddPrize && (
                 <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex gap-4 items-center animate-in slide-in-from-top-2">
                     <input 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入新奖项名称 (如: 三等奖)"
                        value={newPrizeName}
                        onChange={e => setNewPrizeName(e.target.value)}
                     />
                     <Button size="sm" onClick={handleAddPrize}>确认添加</Button>
                 </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {prizes.map(prize => {
                     const isCurrent = currentPrize.id === prize.id;
                     return (
                         <div 
                            key={prize.id}
                            onClick={() => selectPrize(prize.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${isCurrent ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                         >
                             <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                         <img src={prize.image} className="w-full h-full object-cover" />
                                     </div>
                                     <div>
                                         <h4 className={`font-bold text-sm ${isCurrent ? 'text-blue-600' : 'text-slate-700'}`}>{prize.name}</h4>
                                         <p className="text-xs text-slate-500 mt-0.5">数量: {prize.count} | ID: {prize.id.slice(0,4)}</p>
                                     </div>
                                 </div>
                                 {isCurrent && <CheckCircle className="w-5 h-5 text-blue-500" />}
                             </div>
                             
                             {/* Delete Button (Only visible on hover and if not active) */}
                             {!isCurrent && prizes.length > 1 && (
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); deletePrize(prize.id); }}
                                    className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             )}
                         </div>
                     );
                 })}
             </div>
        </section>

        {/* Winner & AI Section */}
        {winners.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden mb-8">
             <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row gap-8">
                <div className="shrink-0">
                    <img src={winners[0].avatar} className="w-32 h-32 rounded-xl border-4 border-yellow-500 shadow-2xl object-cover" />
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 text-yellow-400 mb-2 font-bold tracking-wider text-sm uppercase">
                     <Trophy className="w-4 h-4" />
                     最新中奖者
                   </div>
                   <h2 className="text-4xl font-bold mb-1">{winners[0].name}</h2>
                   <p className="text-slate-400 font-mono text-lg mb-6">抽奖码: {winners[0].code}</p>

                   {/* AI Generation */}
                   <div className="p-5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-blue-300 flex items-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            AI 主持人讲稿 (Gemini)
                        </span>
                        <div className="flex gap-2">
                          {speech && (
                            <Button size="sm" variant="ghost" onClick={handleSpeak} className="text-xs hover:bg-white/10 text-yellow-300 border border-yellow-300/30">
                              <Volume2 className="w-3 h-3 mr-1" /> 播报
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={handleGenerateSpeech} disabled={isGenerating} className="text-xs hover:bg-white/10">
                            {isGenerating ? '生成中...' : '重新生成'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-slate-200 italic leading-relaxed min-h-[3rem]">
                        {speech || "点击生成按钮，让 AI 为中奖者撰写专属颁奖词..."}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* User Moderation List */}
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                    <Users className="w-5 h-5" />
                    实时签到监控
                </h3>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="搜索姓名或手机号..." 
                            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Button variant="secondary" size="sm" onClick={handleExportData} title="导出 CSV">
                        <Download className="w-4 h-4 mr-2" />
                        导出数据
                    </Button>
                </div>
            </div>
            
            {showAdvanced && (
                <div className="mb-4 text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg border border-amber-200 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" /> 
                        <strong>高级模式:</strong> 您已启用开发者功能。
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            className="bg-amber-600 hover:bg-amber-700 border-transparent text-white shadow-none text-xs h-8"
                            onClick={() => generateMockUsers(50)}
                        >
                            <UserPlus className="w-3 h-3 mr-1" />
                            +50 虚拟用户
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 border-transparent text-white shadow-none text-xs h-8"
                            onClick={() => {
                                if(confirm("确定要清空所有用户数据吗？此操作不可恢复。")) {
                                    clearAllUsers();
                                }
                            }}
                        >
                            <XCircle className="w-3 h-3 mr-1" />
                            清空用户
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-20">
                <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-sm font-semibold bg-slate-50">用户</th>
                            <th className="p-4 text-sm font-semibold bg-slate-50">手机号</th>
                            <th className="p-4 text-sm font-semibold bg-slate-50">签到时间</th>
                            <th className="p-4 text-sm font-semibold text-right bg-slate-50">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.slice().reverse().map(user => {
                                const isPreset = presetWinnerId === user.id;
                                const hasWon = winners.some(w => w.id === user.id);
                                
                                return (
                                <tr key={user.id} className={`transition-colors ${isPreset ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} className={`w-10 h-10 rounded-full object-cover border ${isPreset ? 'border-amber-500' : 'border-slate-200'}`} />
                                            {hasWon && <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5"><Trophy className="w-3 h-3" /></div>}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                                {user.name}
                                                {isPreset && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">{user.code}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm font-mono">
                                        {user.phoneNumber || '-'}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {new Date(user.joinedAt).toLocaleTimeString('zh-CN')}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {showAdvanced && !hasWon && (
                                            <button 
                                                onClick={() => setPresetWinner(isPreset ? null : user.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1 border ${isPreset ? 'bg-amber-100 text-amber-700 border-amber-300' : 'text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-500'}`}
                                                title={isPreset ? "取消内定" : "设为下轮必中"}
                                            >
                                                <Crown className="w-4 h-4" />
                                                {isPreset ? '已内定' : '内定'}
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => removeUser(user.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            移出
                                        </button>
                                    </td>
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400">
                                    {searchTerm ? '未找到匹配的用户' : '暂无用户签到'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>

        {/* Sticky Action Footer */}
        <div 
          className="fixed bottom-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out"
          style={{ left: isSidebarCollapsed ? '5rem' : '16rem' }}
        >
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-500">
                     <span className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold">SPACE</span>
                     <span>开始/停止</span>
                 </div>
                 {presetUser && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-200">
                        <Crown className="w-3 h-3" />
                        <span>下轮必中: <strong>{presetUser.name}</strong></span>
                        <button onClick={() => setPresetWinner(null)} className="ml-2 hover:bg-amber-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                 )}
             </div>

             <div className="flex gap-3">
                 <Button onClick={resetLottery} variant="secondary" size="md">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重置
                </Button>
                
                {status === 'idle' || status === 'winner-revealed' ? (
                  <Button onClick={handleStartDraw} size="lg" className="w-64 shadow-blue-500/25">
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    开始滚动
                  </Button>
                ) : (
                  <Button onClick={handleStopDraw} variant="danger" size="lg" className={`w-64 shadow-red-500/25 ${status === 'rolling' ? 'animate-pulse' : 'opacity-50 cursor-wait'}`} disabled={status === 'exploded'}>
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    {status === 'exploded' ? '聚变中...' : '停止并开奖'}
                  </Button>
                )}
             </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
