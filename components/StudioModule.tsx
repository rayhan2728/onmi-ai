
import React, { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon,
  QueueListIcon,
  CircleStackIcon
} from '@heroicons/react/24/solid';
import { analyzeImage, editImage } from '../services/geminiService';

export default function StudioModule() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setVariations([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVariations = async () => {
    if (!sourceImage || isProcessing) return;

    setIsProcessing(true);
    setStatus('Analyzing source image details...');
    setVariations([]);

    try {
      const b64 = sourceImage.split(',')[1];
      
      // Step 1: Analyze to get a perfect prompt
      const description = await analyzeImage(b64, "Describe this image in extreme artistic detail, focusing on style, subjects, colors, and lighting. Be concise.");
      
      const results: string[] = [];
      for (let i = 0; i < 4; i++) {
        setStatus(`Generating variation ${i + 1} of 4...`);
        // Use editImage as a variation generator by passing the same source but asking for artistic differences
        const variantUrl = await editImage(b64, `Generate a creative variation of this image with the following theme: ${description}. Use a unique artistic perspective for this variant.`);
        results.push(variantUrl);
        setVariations([...results]); // Show them one by one
      }
      
      setStatus('All variations synced successfully.');
    } catch (error) {
      console.error(error);
      setStatus('Process failed. Ensure your API key and image size are valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-variation-${index + 1}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <header className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 rounded-xl">
            <SparklesIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Nexus Studio</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Image Variation Lab</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls & Source */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center space-x-2">
                <CircleStackIcon className="w-4 h-4" />
                <span>Source Image</span>
              </h3>
              
              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`aspect-square rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-all ${isProcessing ? 'opacity-50' : 'hover:border-indigo-500/50'}`}
              >
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8">
                    <PhotoIcon className="w-12 h-12 text-slate-700 mx-auto mb-4 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Upload reference image</p>
                  </div>
                )}
                {!isProcessing && sourceImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-xs font-bold text-white uppercase">Change Image</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleUpload} />
              </div>

              <button
                onClick={generateVariations}
                disabled={!sourceImage || isProcessing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generate 4 Variations</span>
                  </>
                )}
              </button>

              {status && (
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">System Status</p>
                  <p className="text-xs text-indigo-400 mono animate-pulse">{status}</p>
                </div>
              )}
            </div>

            <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 text-[11px] text-slate-500 leading-relaxed italic">
              "এই ফিচারটি আপনার দেওয়া ছবির উপর ভিত্তি করে ৪টি আলাদা এবং উন্নত ভার্সন তৈরি করে দেয়।"
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center space-x-2 px-1">
              <QueueListIcon className="w-4 h-4" />
              <span>Studio Output</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden relative group shadow-2xl">
                  {variations[i] ? (
                    <>
                      <img src={variations[i]} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700" />
                      <div className="absolute top-4 right-4 flex space-x-2">
                         <button 
                           onClick={() => downloadImage(variations[i], i)}
                           className="p-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600"
                         >
                           <ArrowDownTrayIcon className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                          Variant {i + 1}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col space-y-2">
                       <SparklesIcon className={`w-8 h-8 text-slate-800 ${isProcessing && variations.length <= i ? 'animate-pulse' : ''}`} />
                       <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Waiting for process</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
