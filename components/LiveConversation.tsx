
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MicrophoneIcon, StopCircleIcon, SignalIcon } from '@heroicons/react/24/solid';
import { getGeminiClient } from '../services/geminiService';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
// Added missing Modality import to follow @google/genai guidelines
import { Modality } from '@google/genai';

export default function LiveConversation() {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopConversation = useCallback(() => {
    setIsActive(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = getGeminiClient();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };
              
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            const b64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (b64) {
              const binary = decode(b64);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(binary, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscripts(prev => [...prev.slice(-9), `Assistant: ${text}`]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscripts(prev => [...prev.slice(-9), `You: ${text}`]);
            }
          },
          onerror: (e) => {
            console.error(e);
            stopConversation();
          },
          onclose: () => stopConversation()
        },
        config: {
          // Use the Modality enum instead of string literals to comply with library standards
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are a helpful companion. Keep responses conversational and concise.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      alert("Microphone access denied or session failed.");
    }
  };

  useEffect(() => {
    return () => stopConversation();
  }, [stopConversation]);

  return (
    <div className="flex flex-col h-full bg-slate-950 items-center justify-center p-4 lg:p-8">
      <div className="max-w-md w-full text-center space-y-6 lg:space-y-8 pb-24 lg:pb-0">
        <div className="relative inline-block">
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${isActive ? 'bg-indigo-500 scale-125 lg:scale-150 animate-pulse' : 'bg-slate-800 scale-100'}`}></div>
          <div className={`relative w-36 h-36 lg:w-48 lg:h-48 rounded-full flex items-center justify-center border-4 transition-all ${isActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 shadow-inner'}`}>
            {isActive ? (
              <div className="flex space-x-1 items-end h-12 lg:h-16">
                <div className="w-1.5 lg:w-2 bg-indigo-400 animate-[bounce_0.6s_infinite]"></div>
                <div className="w-1.5 lg:w-2 bg-indigo-400 animate-[bounce_0.8s_infinite]"></div>
                <div className="w-1.5 lg:w-2 bg-indigo-400 animate-[bounce_1.0s_infinite]"></div>
                <div className="w-1.5 lg:w-2 bg-indigo-400 animate-[bounce_0.7s_infinite]"></div>
              </div>
            ) : (
              <MicrophoneIcon className="w-16 h-16 lg:w-24 lg:h-24 text-slate-800" />
            )}
          </div>
        </div>

        <div className="space-y-2 lg:space-y-4 px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Live Conversation</h2>
          <p className="text-slate-400 text-sm lg:text-base">Real-time low-latency voice interaction.</p>
        </div>

        <div className="space-y-4 px-4">
          {!isActive ? (
            <button
              onClick={startConversation}
              disabled={isConnecting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg lg:text-xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-95"
            >
              {isConnecting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Initializing...</span>
                </span>
              ) : (
                <>
                  <MicrophoneIcon className="w-6 h-6" />
                  <span>Start Call</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopConversation}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-lg lg:text-xl transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-3 active:scale-95"
            >
              <StopCircleIcon className="w-6 h-6" />
              <span>End Call</span>
            </button>
          )}
        </div>

        {transcripts.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 lg:p-6 text-left h-40 lg:h-48 overflow-y-auto space-y-2 mx-4 shadow-xl">
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
              <SignalIcon className="w-3 h-3 text-indigo-400" />
              <span>Transcript Sync</span>
            </div>
            {transcripts.map((t, i) => (
              <p key={i} className={`text-xs lg:text-sm ${t.startsWith('You:') ? 'text-indigo-300 font-medium' : 'text-slate-300'}`}>
                {t}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
