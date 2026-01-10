import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Users, Trophy, Play, Square, Settings, RefreshCw, Wand2, LogOut, Edit, Save, Crown, AlertTriangle, Shield, Eye, EyeOff, Plus, Trash2, Download, Search, CheckCircle, Volume2 } from 'lucide-react';
import { generateCongratulatorySpeech, speakText } from '../services/geminiService';
import { Prize } from '../types';

const AdminDashboard = () => {
  const { users, winners, status, currentPrize, prizes, setStatus, drawWinner, resetLottery, removeUser, updatePrize, presetWinnerId, setPresetWinner, selectPrize, addPrize, deletePrize } = useStore();
  const [speech, setSpeech] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPrize, setIsEditingPrize] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false); // Toggle for "God Mode"
  const [searchTerm, setSearchTerm] = useState("");
  
  // Local state for editing current prize
  const [tempPrizeName, setTempPrizeName] = useState(currentPrize.name);
  const [tempPrizeImage, setTempPrizeImage] = useState(currentPrize.image);

  // New prize form
  const [newPrizeName, setNewPrizeName] = useState("");
  const [showAddPrize, setShowAddPrize] = useState(false);

  const handleStartDraw = () => {
    setSpeech(""); // Clear previous speech
    setStatus('rolling');
  };

  const handleStopDraw = async () => {
    setStatus('idle'); // Intermediate state if needed
    setTimeout(() => {
        drawWinner();
    }, 500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Only trigger if not typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.code === 'Space') {
            e.preventDefault(); // Prevent scrolling
            if (status === 'idle' || status === 'winner-revealed') {
                handleStartDraw();
            } else if (status === 'rolling') {
                handleStopDraw();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]); // Re-bind when status changes

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-blue-500">❖</span> 星云后台
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center p-3 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-900/50 font-medium">
            <Trophy className="w-5 h-5 mr-3" />
            抽奖控制台
          </div>
          <div className="flex items-center p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-colors">
            <Users className="w-5 h-5 mr-3" />
            用户列表 ({users.length})
          </div>
          
          {/* Advanced Mode Toggle */}
          <div 
             onClick={() => setShowAdvanced(!showAdvanced)}
             className={`flex items-center p-3 rounded-lg cursor-pointer transition-all mt-8 border ${showAdvanced ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            {showAdvanced ? <Eye className="w-5 h-5 mr-3" /> : <EyeOff className="w-5 h-5 mr-3" />}
            <span>内定控制模式</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs text-center absolute bottom-0 w-full">
            Nebula System v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto ml-64 pb-32">
        <header className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">活动现场控制</h1>
              <p className="text-slate-500 mt-1">管理抽奖流程与监控数据</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${status === 'rolling' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${status === 'rolling' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              状态: {status === 'idle' ? '待机中' : status === 'rolling' ? '抽奖进行中' : status === 'winner-revealed' ? '中奖展示' : status}
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
                <div className="mb-4 text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> 
                    <strong>高级模式:</strong> 您已启用内定功能，请谨慎操作。
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
        <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
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
                  <Button onClick={handleStopDraw} variant="danger" size="lg" className="w-64 animate-pulse shadow-red-500/25">
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    停止并开奖
                  </Button>
                )}
             </div>
        </div>
      </main>
    </div>
  );
};

// Simple X icon helper for inline usage
const X = (props: any) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
)

export default AdminDashboard;