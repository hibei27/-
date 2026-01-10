import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import BigScreen from './views/BigScreen';
import MobileClient from './views/MobileClient';
import AdminDashboard from './views/AdminDashboard';
import { Monitor, Smartphone, LayoutDashboard } from 'lucide-react';

const LandingNav = () => (
  <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>
    
    <div className="max-w-5xl w-full space-y-16 relative z-10">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
          星云互动系统
        </h1>
        <p className="text-2xl text-slate-400 font-light tracking-wide">NEBULA LOTTERY SYSTEM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link to="/mobile" className="group">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-10 rounded-3xl hover:bg-slate-800 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all cursor-pointer h-full flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
              <Smartphone className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">手机端 (参会者)</h2>
            <p className="text-slate-400 leading-relaxed">用户扫码签到入口，查看个人抽奖码与中奖结果。</p>
          </div>
        </Link>

        <Link to="/screen" className="group">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-10 rounded-3xl hover:bg-slate-800 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all cursor-pointer h-full flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
              <Monitor className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">现场大屏 (展示)</h2>
            <p className="text-slate-400 leading-relaxed">活动现场主屏幕，展示3D签到墙、实时互动与酷炫抽奖。</p>
          </div>
        </Link>

        <Link to="/admin" className="group">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-10 rounded-3xl hover:bg-slate-800 hover:border-green-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all cursor-pointer h-full flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-green-500/20 transition-all duration-300">
              <LayoutDashboard className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">后台管理 (控台)</h2>
            <p className="text-slate-400 leading-relaxed">管理员控制面板，负责流程控制、数据监控与用户审核。</p>
          </div>
        </Link>
      </div>
      
      <div className="text-center text-slate-600 text-sm">
         &copy; 2024 Nebula Interactive. All rights reserved.
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingNav />} />
        <Route path="/screen" element={<BigScreen />} />
        <Route path="/mobile" element={<MobileClient />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
};

export default App;