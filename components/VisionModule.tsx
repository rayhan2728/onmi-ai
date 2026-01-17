
import React, { useState } from 'react';
import { PhotoIcon, SparklesIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { analyzeImage, generateImage, editImage } from '../services/geminiService';

export default function VisionModule() {
  const [mode, setMode] = useState<'analyze' | 'generate' | 'edit'>('analyze');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (!prompt.trim() && mode !== 'analyze') return;
    if (isLoading) return;
    
    setIsLoading(true);
    setResult('');

    try {
      if (mode === 'analyze' && selectedImage) {
        const base64 = selectedImage.split(',')[1];
        const res = await analyzeImage(base64, prompt || "Describe this image in detail.");
        setResult(res || 'Analysis failed');
      } else if (mode === 'generate') {
        const url = await generateImage(prompt);
        setSelectedImage(url);
        setResult('New image generated successfully!');
      } else if (mode === 'edit' && selectedImage) {
        const base64 = selectedImage.split(',')[1];
        const url = await editImage(base64, prompt);
        setSelectedImage(url);
        setResult('Image successfully modified based on your instructions!');
      } else {
        setResult('Please upload an image first.');
      }
    } catch (error) {
      console.error(error);
      setResult('Error processing request. Check if your prompt is valid or if the image size is too large.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-lg lg:text-xl font-bold">Vision Lab</h2>
        <p className="text-slate-400 text-xs lg:text-sm">Image Intelligence & AI Synthesis</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-6xl mx-auto w-full space-y-6 lg:space-y-8 pb-24 lg:pb-8">
        <div className="flex justify-center">
          <div className="bg-slate-900 p-1 rounded-2xl flex border border-slate-800 w-full sm:w-auto shadow-lg">
            <button
              onClick={() => setMode('analyze')}
              className={`flex-1 sm:px-6 py-2 rounded-xl transition-all text-sm lg:text-base font-medium flex items-center justify-center space-x-2 ${mode === 'analyze' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>Analyze</span>
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`flex-1 sm:px-6 py-2 rounded-xl transition-all text-sm lg:text-base font-medium flex items-center justify-center space-x-2 ${mode === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMode('generate')}
              className={`flex-1 sm:px-6 py-2 rounded-xl transition-all text-sm lg:text-base font-medium flex items-center justify-center space-x-2 ${mode === 'generate' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[400px]">
          <div className="space-y-4 lg:space-y-6 order-1">
            <div className={`bg-slate-900/50 border-2 border-dashed rounded-2xl lg:rounded-3xl overflow-hidden aspect-square flex flex-col items-center justify-center relative group transition-all shadow-inner ${isLoading ? 'border-indigo-500 animate-pulse' : 'border-slate-800 hover:border-indigo-500/50'}`}>
              {selectedImage ? (
                <img src={selectedImage} alt="Viewport" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 lg:p-8">
                  <PhotoIcon className="w-12 h-12 lg:w-16 lg:h-16 text-slate-700 mx-auto mb-3 lg:mb-4 group-hover:text-indigo-400 transition-colors" />
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">
                    {mode === 'generate' ? 'Generation preview will appear here' : 'Click or tap to upload an image from gallery'}
                  </p>
                </div>
              )}
              {mode !== 'generate' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title="Upload image"
                />
              )}
            </div>

            <div className="space-y-3 lg:space-y-4">
              <label className="text-[10px] lg:text-sm font-bold text-slate-500 uppercase tracking-widest">
                {mode === 'analyze' ? 'Questions or Instructions' : mode === 'edit' ? 'How should I change this image?' : 'Visual Description'}
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'analyze' ? "Describe what you see or ask a question..." : 
                    mode === 'edit' ? "Ex: 'Add a sunset', 'Change colors to neon', 'Put a cat on the sofa'..." : 
                    "Ex: 'A cyberpunk city in the rain'..."
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-12 lg:pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 lg:h-32 resize-none text-sm lg:text-base text-slate-100 placeholder:text-slate-600"
                />
                <button
                  onClick={handleAction}
                  disabled={(!prompt.trim() && mode !== 'analyze') || isLoading || (mode !== 'generate' && !selectedImage)}
                  className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 p-2.5 lg:p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    mode === 'analyze' ? <MagnifyingGlassIcon className="w-5 h-5 lg:w-6 lg:h-6" /> : mode === 'edit' ? <PencilSquareIcon className="w-5 h-5 lg:w-6 lg:h-6" /> : <SparklesIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col order-2">
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 flex-1 flex flex-col min-h-[200px] lg:min-h-auto shadow-xl">
              <div className="flex items-center space-x-2 mb-3 lg:mb-4">
                <ClipboardDocumentListIcon className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400" />
                <h3 className="text-sm lg:text-base font-bold text-slate-200">Processing Insights</h3>
              </div>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-slate-300 leading-relaxed mono text-xs lg:text-sm p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Neural Processing...</span>
                  </div>
                ) : result || "Your analysis results or edit status will appear here. Upload an image to begin."}
              </div>
              {selectedImage && mode === 'edit' && !isLoading && (
                 <p className="mt-4 text-[10px] text-slate-500 italic text-center">
                    Pro-tip: You can keep editing the resulting image by changing the prompt.
                 </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
