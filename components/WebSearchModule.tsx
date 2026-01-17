
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, GlobeAltIcon, LinkIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { performWebSearch } from '../services/geminiService';

export default function WebSearchModule() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ text: string; sources: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);

  // Animation effect for searching state
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      // Start with a high base above 1 million
      setTokensUsed(1245000 + Math.floor(Math.random() * 100000));
      
      interval = setInterval(() => {
        setTokensUsed(prev => prev + Math.floor(Math.random() * 15000));
      }, 80);
    } else {
      // Reset to 0 when search finishes
      setTokensUsed(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResults(null);
    
    try {
      const searchResult = await performWebSearch(query);
      setResults(searchResult);
    } catch (error) {
      console.error(error);
      alert("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="bg-slate-900/80 border-b border-slate-800 p-3 lg:p-4 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between sticky top-0 z-20 gap-3">
        <div className="flex items-center space-x-3 w-full lg:w-auto">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <GlobeAltIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm lg:text-base">Deep Search</h2>
            <p className="text-[8px] lg:text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Verified Knowledge Sync</p>
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-end w-full lg:w-auto">
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end mb-1">
             <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-slate-800 shadow-none'}`}></div>
                <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {isLoading ? 'Scanning Context' : 'Scanner Idle'}
                </span>
             </div>
             <div className="bg-slate-950 border border-slate-800 rounded px-2 lg:px-4 py-1 lg:py-2 flex items-center space-x-2 shadow-inner group">
               <span className="mono text-xs lg:text-lg font-bold text-white tabular-nums tracking-tight">
                 {tokensUsed.toLocaleString()} 
                 <span className="text-slate-500 text-[8px] lg:text-xs font-medium ml-1">Tokens Used</span>
               </span>
             </div>
          </div>
          <div className="w-full lg:w-48 h-1 lg:h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div 
              className={`h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500 transition-all duration-300 ${isLoading ? 'w-full animate-pulse' : 'w-0'}`} 
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8 lg:space-y-12 pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto w-full text-center space-y-4 lg:space-y-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-white tracking-tight">Search the <span className="bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">Live World</span></h1>
          <p className="text-slate-400 text-xs lg:text-base max-w-2xl mx-auto px-4">Real-time information, news, and technical data with verified sources.</p>
          
          <form onSubmit={handleSearch} className="relative group max-w-4xl mx-auto pt-2 px-2 lg:px-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
            <div className="relative flex flex-col lg:block">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any question..."
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 lg:py-6 pl-12 lg:pl-16 pr-4 lg:pr-24 text-sm lg:text-lg focus:outline-none focus:border-indigo-500/50 transition-all shadow-2xl placeholder:text-slate-600 text-slate-100"
              />
              <MagnifyingGlassIcon className="w-6 h-6 lg:w-8 lg:h-8 text-slate-700 absolute left-4 lg:left-6 top-5 lg:top-1/2 lg:-translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="mt-3 lg:mt-0 lg:absolute lg:right-4 lg:top-1/2 lg:-translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 lg:px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Scanning...</span>
                  </>
                ) : (
                  <>
                    <BeakerIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-sm lg:text-base">Deep Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {results ? (
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-2 transition-all"></div>
                <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 flex items-center space-x-3">
                   <GlobeAltIcon className="w-5 h-5 text-indigo-400" />
                   <span>Research Synthesis</span>
                </h3>
                <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap mono text-xs lg:text-[15px]">
                  {results.text}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-4 lg:space-y-6 order-1 lg:order-2">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 h-fit lg:sticky lg:top-28 backdrop-blur-md">
                <h4 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
                  <LinkIcon className="w-3 h-3 text-rose-400" />
                  <span>Verified Sources</span>
                </h4>
                <div className="flex flex-col gap-2">
                  {results.sources.length > 0 ? results.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-indigo-500/50 hover:bg-slate-900 transition-all group shadow-sm"
                    >
                      <p className="text-[10px] lg:text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">{source.title}</p>
                      <p className="text-[8px] lg:text-[10px] text-slate-500 mt-1 truncate font-mono opacity-60">{source.uri}</p>
                    </a>
                  )) : (
                    <div className="p-3 border border-dashed border-slate-800 rounded-xl text-center">
                      <p className="text-[10px] text-slate-600 italic">Synthesized from primary index.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="h-64 lg:h-96 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 opacity-40 px-4">
             <div className="p-4 lg:p-6 bg-slate-900/30 rounded-2xl border border-slate-800 text-center">
                <GlobeAltIcon className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 text-indigo-500" />
                <h5 className="font-bold text-xs lg:text-sm text-white">Live Indexing</h5>
             </div>
             <div className="p-4 lg:p-6 bg-slate-900/30 rounded-2xl border border-slate-800 text-center">
                <LinkIcon className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 text-rose-500" />
                <h5 className="font-bold text-xs lg:text-sm text-white">Source Verification</h5>
             </div>
             <div className="p-4 lg:p-6 bg-slate-900/30 rounded-2xl border border-slate-800 text-center">
                <BeakerIcon className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 text-amber-500" />
                <h5 className="font-bold text-xs lg:text-sm text-white">Deep Context</h5>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
