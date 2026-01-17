
import React, { useState, useEffect, useRef } from 'react';
import { 
  CodeBracketSquareIcon, 
  ArrowDownTrayIcon, 
  PlayIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  CommandLineIcon,
  DevicePhoneMobileIcon,
  WindowIcon,
  ArrowsPointingOutIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { getGeminiClient } from '../services/geminiService';

export default function ExportModule() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const defaultCode = `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen">
    <div class="text-center p-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl max-w-sm mx-auto">
        <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">Nexus Builder</h1>
        <p class="text-slate-400">Describe your app and click "Generate App" to start building!</p>
    </div>
</body>
</html>`;

  useEffect(() => {
    if (code === '') setCode(defaultCode);
  }, []);

  const generateApp = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setActiveTab('editor');

    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are a World-Class Senior Frontend Engineer. 
      Generate a complete, high-quality, single-file HTML application or game.
      Use Tailwind CSS (CDN) for styling. 
      Use Lucide Icons or Heroicons (CDN) if needed.
      Ensure the code is modern, interactive, and mobile-responsive.
      Return ONLY the raw HTML code without any markdown formatting or explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create this app: ${prompt}`,
        config: { systemInstruction }
      });

      let generatedCode = response.text || '';
      generatedCode = generatedCode.replace(/```html/g, '').replace(/```/g, '').trim();
      
      if (generatedCode) {
        setCode(generatedCode);
        setActiveTab('preview');
        setPreviewKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Generation failed. Check your connection or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-generated-app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header - More compact for mobile */}
      <header className="p-3 lg:p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-bold flex items-center space-x-2">
              <CodeBracketSquareIcon className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
              <span>Nexus Builder</span>
            </h2>
            <p className="text-slate-500 text-[9px] lg:text-xs uppercase tracking-widest font-bold">Powered by Gemini 3 Flash</p>
          </div>
          <button onClick={handleDownload} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-1 lg:gap-2">
           <button 
             onClick={() => setActiveTab('editor')}
             className={`flex-1 lg:flex-none px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 lg:space-x-2 ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
           >
             <CommandLineIcon className="w-4 h-4" />
             <span>Editor</span>
           </button>
           <button 
             onClick={() => setActiveTab('preview')}
             className={`flex-1 lg:flex-none px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 lg:space-x-2 ${activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
           >
             <PlayIcon className="w-4 h-4" />
             <span>Preview</span>
           </button>
           <div className="hidden lg:block w-[1px] h-6 bg-slate-800 mx-1"></div>
           <button 
             onClick={handleDownload}
             className="hidden lg:flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all items-center space-x-2 border border-slate-700"
           >
             <ArrowDownTrayIcon className="w-4 h-4" />
             <span>Download HTML</span>
           </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 lg:p-4 gap-2 lg:gap-4">
        
        {/* Input Station - Compacted on mobile */}
        <div className="w-full lg:w-80 flex flex-col gap-2 lg:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-3 lg:p-5 shadow-xl flex flex-col gap-3 lg:gap-4">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center space-x-2">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Prompt Engine</span>
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: 'Snake game' or 'Neon Calculator'..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl p-3 lg:p-4 h-24 lg:h-40 text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none text-slate-200"
            />
            <button
              onClick={generateApp}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2.5 lg:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl lg:rounded-2xl text-xs lg:text-base font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Generate App</span>
                </>
              )}
            </button>
          </div>

          <div className="hidden lg:block bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed italic">
            Describe your vision. Gemini 3 Flash builds mobile-ready apps in seconds.
          </div>
        </div>

        {/* Viewport Station - Responsive sizing */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[300px]">
          {activeTab === 'editor' ? (
            <div className="flex-1 relative">
               <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10">
                  <div className="bg-slate-950/80 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-slate-800 text-[8px] lg:text-[10px] font-bold text-emerald-400 uppercase tracking-widest backdrop-blur-md">
                    Source Code
                  </div>
               </div>
               <textarea
                 value={code}
                 onChange={(e) => setCode(e.target.value)}
                 className="w-full h-full bg-slate-950 p-4 lg:p-6 mono text-[10px] lg:text-sm text-indigo-300 focus:outline-none resize-none"
                 spellCheck={false}
               />
            </div>
          ) : (
            <div className="flex-1 bg-slate-950 relative flex flex-col">
              {/* Preview Toolbar */}
              <div className="bg-slate-900/50 border-b border-slate-800 p-2 flex items-center justify-between">
                 <div className="flex space-x-1.5 ml-2 lg:ml-4">
                   <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                   <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                   <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                 </div>
                 
                 <div className="flex items-center space-x-1 lg:space-x-3">
                    {/* Device Toggles */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-0.5 flex">
                      <button 
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-1 lg:p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-400'}`}
                        title="Desktop View"
                      >
                        <WindowIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button 
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-1 lg:p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-400'}`}
                        title="Mobile View"
                      >
                        <DevicePhoneMobileIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => setPreviewKey(k => k + 1)} 
                      className="p-1.5 lg:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors border border-slate-700"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </button>
                 </div>
                 <div className="w-10 lg:w-20"></div>
              </div>

              {/* Responsive Container for Iframe */}
              <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950">
                <div 
                  className={`bg-white transition-all duration-500 ease-in-out shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden ${
                    previewMode === 'mobile' 
                    ? 'w-[320px] h-[568px] lg:w-[375px] lg:h-[667px] border-[8px] lg:border-[12px] border-slate-900 rounded-[2.5rem] lg:rounded-[3rem] sticky top-0' 
                    : 'w-full h-full rounded-xl lg:rounded-2xl'
                  }`}
                >
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={code}
                    className="w-full h-full border-none"
                    title="Nexus Preview"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
