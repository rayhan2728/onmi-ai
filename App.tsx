
import { 
  ChatBubbleBottomCenterTextIcon, 
  EyeIcon, 
  FilmIcon, 
  ChartBarSquareIcon, 
  QueueListIcon,
  MicrophoneIcon,
  GlobeAltIcon,
  CodeBracketSquareIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AgentPlanner from './components/AgentPlanner';
import ChatModule from './components/ChatModule';
import DataInsight from './components/DataInsight';
import DateTimeDisplay from './components/DateTimeDisplay';
import ExportModule from './components/ExportModule';
import LiveConversation from './components/LiveConversation';
import MediaForge from './components/MediaForge';
import VisionModule from './components/VisionModule';
import WebSearchModule from './components/WebSearchModule';
import StudioModule from './components/StudioModule';

const SidebarItem: React.FC<{ to: string; icon: any; label: string; active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link to={to} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
    active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
  }`}>
    <Icon className="w-6 h-6" />
    <span className="font-medium whitespace-nowrap">{label}</span>
  </Link>
);

const MobileNavItem: React.FC<{ to: string; icon: any; active: boolean }> = ({ to, icon: Icon, active }) => (
  <Link to={to} className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
    active ? 'text-indigo-400' : 'text-slate-500'
  }`}>
    <Icon className="w-6 h-6" />
  </Link>
);

const DesktopNavigation: React.FC = () => {
  const location = useLocation();
  return (
    <div className="hidden lg:flex w-64 border-r border-slate-800 p-6 flex-col h-full bg-slate-900/50 backdrop-blur-xl">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
          Gemini Nexus
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-bold leading-tight">রায়হান দ্বারা তৈরি পাওয়ার ফুল AI</p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        <SidebarItem to="/" label="Omni Chat" icon={ChatBubbleBottomCenterTextIcon} active={location.pathname === '/'} />
        <SidebarItem to="/studio" label="Image Studio" icon={SparklesIcon} active={location.pathname === '/studio'} />
        <SidebarItem to="/search" label="Deep Search" icon={GlobeAltIcon} active={location.pathname === '/search'} />
        <SidebarItem to="/media" label="App Forge" icon={RocketLaunchIcon} active={location.pathname === '/media'} />
        <SidebarItem to="/vision" label="Vision Lab" icon={EyeIcon} active={location.pathname === '/vision'} />
        <SidebarItem to="/data" label="Data Insight" icon={ChartBarSquareIcon} active={location.pathname === '/data'} />
        <SidebarItem to="/agent" label="Task Agent" icon={QueueListIcon} active={location.pathname === '/agent'} />
        <SidebarItem to="/live" label="Live Voice" icon={MicrophoneIcon} active={location.pathname === '/live'} />
        <SidebarItem to="/export" label="Builder Hub" icon={CodeBracketSquareIcon} active={location.pathname === '/export'} />
        
        <div className="pt-4">
           <DateTimeDisplay />
        </div>
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-4 py-2 text-slate-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
          <span className="font-bold">Pro Access Active</span>
        </div>
      </div>
    </div>
  );
};

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center h-16 px-2 z-50">
      <MobileNavItem to="/" icon={ChatBubbleBottomCenterTextIcon} active={location.pathname === '/'} />
      <MobileNavItem to="/studio" icon={SparklesIcon} active={location.pathname === '/studio'} />
      <MobileNavItem to="/search" icon={GlobeAltIcon} active={location.pathname === '/search'} />
      <MobileNavItem to="/media" icon={RocketLaunchIcon} active={location.pathname === '/media'} />
      <MobileNavItem to="/vision" icon={EyeIcon} active={location.pathname === '/vision'} />
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
        <DesktopNavigation />
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 py-2 px-4 text-center z-40">
           <p className="text-[11px] font-bold text-slate-300">রায়হান দ্বারা তৈরি পাওয়ার ফুল AI</p>
        </div>
        <main className="flex-1 relative overflow-hidden flex flex-col pb-16 lg:pb-0">
          <Routes>
            <Route path="/" element={<ChatModule />} />
            <Route path="/studio" element={<StudioModule />} />
            <Route path="/search" element={<WebSearchModule />} />
            <Route path="/vision" element={<VisionModule />} />
            <Route path="/media" element={<MediaForge />} />
            <Route path="/data" element={<DataInsight />} />
            <Route path="/agent" element={<AgentPlanner />} />
            <Route path="/live" element={<LiveConversation />} />
            <Route path="/export" element={<ExportModule />} />
          </Routes>
        </main>
        <MobileNavigation />
      </div>
    </Router>
  );
}
