
import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  CpuChipIcon, 
  PlusIcon,
  ExclamationCircleIcon, 
  MicrophoneIcon,
  PhotoIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  BoltIcon,
  CircleStackIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  Bars3BottomLeftIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { createChat, generateImage, analyzeImage, editImage } from '../services/geminiService';
import { 
  saveSessionsToMemory, 
  loadSessionsFromMemory, 
  saveActiveSessionId, 
  getActiveSessionId,
  ChatSession 
} from '../services/memoryService';
import { Message } from '../types';

export interface GroundedMessage extends Message {
  sources?: { title: string; uri: string }[];
  isError?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  isGenerating?: boolean;
}

export default function ChatModule() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [tokenSearchCount, setTokenSearchCount] = useState(0);
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    const loadedSessions = loadSessionsFromMemory();
    const lastActiveId = getActiveSessionId();
    
    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      setActiveSessionId(lastActiveId && loadedSessions.find(s => s.id === lastActiveId) ? lastActiveId : loadedSessions[0].id);
    } else {
      createNewSession();
    }
    setupSpeechRecognition();
  }, []);

  // Sync memory and scroll
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToMemory(sessions);
    }
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  // Sync Chat Instance when session changes
  useEffect(() => {
    initChat();
  }, [activeSessionId]);

  // Token Search Animation Logic
  useEffect(() => {
    let interval: any;
    const isActive = input.length > 0 || isLoading;
    
    if (isActive) {
      if (tokenSearchCount === 0) {
        setTokenSearchCount(1000000 + Math.floor(Math.random() * 500000));
      }
      
      interval = setInterval(() => {
        setTokenSearchCount(prev => prev + Math.floor(Math.random() * 250000));
      }, 50);
    } else {
      setTokenSearchCount(0);
    }
    
    return () => clearInterval(interval);
  }, [input.length, isLoading]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'নতুন চ্যাট',
      messages: [], 
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistory(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const initChat = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (!activeSession) return;

    const systemInstruction = `You are Nexus Pro, a World-Class AI created by Rayhan. 
    - You possess advanced image generation and editing capabilities using Gemini 2.5 Flash.
    - NEVER claim you cannot edit images. If a user asks to "add a person" or "change something" in an uploaded image, you MUST confirm you can do it and proceed.
    - If a user uploads an image and mentions "add", "change", "variation", "similar", "same type", "more like this" (মতো/একই/আরও/বসাও/যোগ/পরিবর্তন), you should initiate image editing or variation logic.
    - Always answer concise and accurate.
    - Suggest useful follow-up topics at the end with "🚀 Nexus Pro Suggestion:".`;
    
    chatRef.current = createChat('gemini-3-flash-preview', systemInstruction);
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'bn-BD';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(undefined, transcript);
      };
      recognitionRef.current = recognition;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const finalInput = customInput || input;
    if ((!finalInput.trim() && !attachedImage) || isLoading || !activeSessionId) return;

    const userMsg: GroundedMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalInput, 
      timestamp: Date.now(),
      imageUrl: attachedImage || undefined 
    };
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        let newTitle = s.title;
        if ((s.messages.length === 0 || s.title === 'নতুন চ্যাট') && finalInput.trim()) {
           newTitle = finalInput.slice(0, 30) + (finalInput.length > 30 ? '...' : '');
        }
        return { ...s, title: newTitle, messages: [...s.messages, userMsg], timestamp: Date.now() };
      }
      return s;
    }));

    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderAssistantMsg: GroundedMessage = { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, placeholderAssistantMsg] } : s));

    try {
      let responseText = "";
      const lowerInput = finalInput.toLowerCase();
      // Expanded keyword check for editing/modification
      const isEditRequest = (text: string) => [
        'add', 'change', 'edit', 'modify', 'put', 'next to', 'beside',
        'যোগ', 'অ্যাড', 'পাশে', 'বসাও', 'দাও', 'মতো', 'মত', 'একই', 
        'same', 'similar', 'আরো', 'আরও', 'more', 'variation', 'পরিবর্তন'
      ].some(k => text.toLowerCase().includes(k));
      
      if (userMsg.imageUrl && isEditRequest(finalInput)) {
        const b64 = userMsg.imageUrl.split(',')[1];
        
        // Count detection for multiple variations
        const countMatch = finalInput.match(/(\d+)/);
        const count = countMatch ? Math.min(parseInt(countMatch[0]), 4) : 1; 
        
        const generatedUrls: string[] = [];
        
        if (count > 1 || lowerInput.includes('মতো') || lowerInput.includes('একই') || lowerInput.includes('আরও')) {
          const targetCount = count > 1 ? count : (lowerInput.includes('আরও') ? 3 : 1);
          
          for (let i = 0; i < targetCount; i++) {
             const url = await editImage(b64, finalInput);
             generatedUrls.push(url);
             setSessions(prev => prev.map(s => s.id === activeSessionId ? {
               ...s,
               messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: `আপনার অনুরোধ অনুযায়ী ${targetCount}টি ছবি প্রসেস করা হচ্ছে... (${i+1}/${targetCount})`, imageUrls: [...generatedUrls] } : m)
             } : s));
          }
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: `আপনার বর্ণনানুযায়ী ${targetCount}টি ছবি জেনারেট করা হয়েছে।`, imageUrls: generatedUrls, isGenerating: false } : m)
          } : s));
        } else {
          const editedUrl = await editImage(b64, finalInput);
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: "আপনার অনুরোধ অনুযায়ী ছবিটি এডিট করে জেনারেট করা হয়েছে।", imageUrl: editedUrl, isGenerating: false } : m)
          } : s));
        }
      } 
      else if (userMsg.imageUrl) {
        const b64 = userMsg.imageUrl.split(',')[1];
        responseText = await analyzeImage(b64, finalInput || "Describe this image in detail.");
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: responseText, isGenerating: false } : m)
        } : s));
      } 
      else if (['আঁকো', 'draw', 'image', 'ছবি'].some(k => finalInput.toLowerCase().includes(k))) {
        const imgUrl = await generateImage(finalInput);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: "আপনার বর্ণনানুসারে ছবিটি তৈরি করা হয়েছে:", imageUrl: imgUrl, isGenerating: false } : m)
        } : s));
      } 
      else {
        const stream = await chatRef.current.sendMessageStream({ message: finalInput });
        for await (const chunk of stream) {
          responseText += chunk.text;
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: responseText } : m)
          } : s));
        }
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, isGenerating: false } : m)
        } : s));
      }
    } catch (err: any) {
      console.error(err);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: `Neural sync interrupted: ${err.message || 'Check your network.'}`, isError: true, isGenerating: false } : m)
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden relative">
      
      {/* Sessions Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:relative lg:translate-x-0 ${showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <CircleStackIcon className="w-4 h-4" />
              <span>Chat History</span>
            </h3>
            <button onClick={() => setShowHistory(false)} className="lg:hidden p-1 text-slate-500">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            <button onClick={createNewSession} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700 text-slate-200">
              <PlusIcon className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-20">
            {sessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${activeSessionId === s.id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChatBubbleLeftRightIcon className={`w-4 h-4 flex-shrink-0 ${activeSessionId === s.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <span className={`text-xs truncate font-medium ${activeSessionId === s.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {s.title}
                  </span>
                </div>
                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-600 transition-all">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 px-6 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-30 h-16">
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowHistory(true)} className="lg:hidden p-2 bg-slate-800 rounded-lg text-slate-400">
              <Bars3BottomLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl transition-all duration-700 ${isLoading ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-slate-800'}`}>
                <CpuChipIcon className={`w-5 h-5 ${isLoading ? 'text-indigo-300 animate-pulse' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nexus Pro</span>
                  <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px]">{activeSession?.title || 'Nexus Syncing'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <div className={`transition-all duration-500 flex flex-col items-end ${tokenSearchCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="flex items-center space-x-2">
                  <BoltIcon className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Live Token Search</span>
                </div>
                <p className="mono text-xs font-bold text-white tabular-nums">
                  {tokenSearchCount.toLocaleString()}
                </p>
            </div>

             <button 
                onClick={createNewSession}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/20 transition-all active:scale-90"
                title="নতুন চ্যাট শুরু করুন"
             >
                <PlusIcon className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth pb-40">
          {activeSession?.messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] lg:max-w-[75%] rounded-3xl px-5 py-4 shadow-2xl transition-all duration-300 relative ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none ring-1 ring-white/10 shadow-[0_10px_30px_rgba(79,70,229,0.3)]' 
                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-[0_10px_30px_rgba(0,0,0,0.4)]'
              }`}>
                {msg.imageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-[1.01] transition-transform">
                    <img src={msg.imageUrl} alt="Nexus Visual" className="w-full max-h-[500px] object-contain bg-black/40" />
                  </div>
                )}
                {msg.imageUrls && msg.imageUrls.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {msg.imageUrls.map((url, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer">
                        <img src={url} alt={`Generated Variation ${i+1}`} className="w-full aspect-square object-cover bg-black/40" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm lg:text-[15px] leading-relaxed mono">
                  {msg.content}
                  {msg.isGenerating && <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-1 align-middle"></span>}
                  {msg.isError && (
                    <div className="mt-2 p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      <span>{msg.content}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] mt-2 text-slate-600 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {activeSession?.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none pt-20">
              <CpuChipIcon className="w-20 h-20 text-slate-700 mb-4" />
              <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-600">Nexus Standby</p>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-40">
          <div className="bg-slate-900/80 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
            {attachedImage && (
              <div className="absolute -top-24 left-6 p-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4">
                <img src={attachedImage} className="w-16 h-16 object-cover rounded-lg" />
                <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-600 rounded-full p-1 shadow-lg">
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 px-6 py-2 border-b border-slate-800/30 mb-1">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest">
                <PhotoIcon className="w-4 h-4" />
                <span>Media</span>
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-800"></div>
              <button onClick={() => setInput("আঁকো: ")} className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 transition-all text-[10px] font-black uppercase tracking-widest">
                <PaintBrushIcon className="w-4 h-4" />
                <span>Draw AI</span>
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-800"></div>
              <Link to="/studio" className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest">
                <SparklesIcon className="w-4 h-4" />
                <span>Studio</span>
              </Link>
            </div>

            <form onSubmit={handleSend} className="flex items-center space-x-2 p-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="কিছু বলুন, আমি সব মনে রাখি..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm lg:text-base py-3 px-6 placeholder:text-slate-600"
              />
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
              
              <div className="flex items-center space-x-2 pr-3">
                <button 
                  type="button" 
                  onClick={() => recognitionRef.current?.start()}
                  className={`p-3 rounded-full transition-all ${isListening ? 'bg-rose-500/30 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                <button 
                  type="submit"
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl disabled:opacity-50 transition-all active:scale-95"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
