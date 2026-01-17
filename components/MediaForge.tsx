
import React, { useState, useRef, useEffect } from 'react';
import { 
  CodeBracketSquareIcon, 
  ArrowDownTrayIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  CommandLineIcon,
  PlayIcon,
  WindowIcon,
  DevicePhoneMobileIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { getGeminiClient } from '../services/geminiService';

export default function MediaForge() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const defaultCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float { animation: float 3s ease-in-out infinite; }
    </style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 font-sans">
    <div class="max-w-md w-full text-center space-y-6 bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div class="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto float border border-indigo-500/30">
            <svg class="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <div>
            <h1 class="text-3xl font-black bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent mb-2">App Forge</h1>
            <p class="text-slate-400 text-sm leading-relaxed">আপনার অ্যাপের আইডিয়াটি লিখুন এবং "Build App" বাটনে ক্লিক করুন। আমি মুহূর্তের মধ্যে আপনার জন্য একটি পূর্ণাঙ্গ অ্যাপ তৈরি করে দিবো।</p>
        </div>
        <div class="pt-4">
            <div class="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Ready for Deployment</span>
            </div>
        </div>
    </div>
</body>
</html>`;

  useEffect(() => {
    if (code === '') setCode(defaultCode);
  }, []);

  const generateApp = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are a World-Class Senior Frontend Engineer and UI/UX Designer.
      Task: Generate a single-file, production-ready HTML application based on the user prompt.
      
      Requirements:
      1. Use Tailwind CSS (via CDN) for high-end modern styling.
      2. Use clean, professional, and dark-themed UI by default unless specified otherwise.
      3. Ensure it is fully responsive (Mobile/Desktop).
      4. Include interactive JavaScript logic to make the app functional.
      5. Use Heroicons or Lucide icons if needed.
      6. Return ONLY the raw HTML code without markdown blocks or explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create this app: ${prompt}. Focus on a premium user experience.`,
        config: { systemInstruction }
      });

      let generatedCode = response.text || '';
      // Clean up markdown if model provides it anyway
      generatedCode = generatedCode.replace(/```html/g, '').replace(/```/g, '').trim();
      
      if (generatedCode) {
        setCode(generatedCode);
        setPreviewKey(prev => prev + 1);
      }
    } catch (err: any) {
      console.error(err);
      alert("Generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-app-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Dynamic Header */}
      <header className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-2xl z-30 flex items-center justify-between h-20">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
            <CodeBracketSquareIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-xl font-black tracking-tight">App Forge</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Build • Preview • Deploy</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex bg-slate-950/50 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <WindowIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={downloadHtml}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-xl active:scale-95"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Download HTML</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Input Sidebar */}
        <div className="w-full lg:w-96 p-4 lg:p-6 bg-slate-900/30 border-r border-slate-800 overflow-y-auto z-20">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                <span>Application Logic</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: 'Create a modern Task Management App with local storage support and dark mode'..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 h-48 lg:h-64 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none text-slate-100 placeholder:text-slate-700 shadow-inner"
              />
            </div>

            <button
              onClick={generateApp}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-[0.98] text-sm uppercase tracking-wider"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Building Assets...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5" />
                  <span>Build Application</span>
                </>
              )}
            </button>

            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Developer Console</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">Model</span>
                  <span className="text-[10px] font-bold text-indigo-400">Gemini 3 Flash</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">Framework</span>
                  <span className="text-[10px] font-bold text-emerald-400">Tailwind CSS v3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">Response</span>
                  <span className="text-[10px] font-bold text-amber-400">Native HTML/JS</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-600 italic leading-relaxed text-center px-4">
              "আমি আপনার বর্ণনানুসারে সম্পূর্ণ ফাংশনাল অ্যাপ তৈরি করে দিবো। কোনো ভুল হলে পুনরায় প্রম্পট দিন।"
            </p>
          </div>
        </div>

        {/* Right Preview Viewport */}
        <div className="flex-1 bg-slate-950 p-4 lg:p-10 flex items-center justify-center relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div 
            className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden relative flex flex-col ${
              previewMode === 'mobile' 
              ? 'w-[320px] h-[568px] lg:w-[375px] lg:h-[700px] border-[12px] border-slate-900 rounded-[3.5rem] ring-1 ring-white/10' 
              : 'w-full h-full rounded-[2.5rem] border border-slate-800/50'
            }`}
          >
            {/* Device Specific Elements */}
            {previewMode === 'mobile' && (
              <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50"></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-50"></div>
              </>
            )}

            <iframe
              key={previewKey}
              ref={iframeRef}
              srcDoc={code}
              className="w-full h-full border-none bg-white"
              title="App Forge Live Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
            />
            
            {/* Overlay during generation */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <SparklesIcon className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Architecting Your Nexus...</h3>
                <p className="text-slate-500 text-sm max-w-xs">Writing high-performance code and styling the interface based on your neural input.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
