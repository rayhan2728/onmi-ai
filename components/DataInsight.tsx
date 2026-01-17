
import React, { useState } from 'react';
import { ChartBarIcon, TableCellsIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeData } from '../services/geminiService';

export default function DataInsight() {
  const [csvContent, setCsvContent] = useState('');
  const [query, setQuery] = useState('Analyze this data and find key trends.');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCsvContent(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const runAnalysis = async () => {
    if (!csvContent || isLoading) return;
    setIsLoading(true);
    try {
      const result = await analyzeData(csvContent, query);
      setAnalysis(result);
    } catch (err) {
      alert("Failed to analyze data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-lg lg:text-xl font-bold">Data Insight</h2>
        <p className="text-slate-400 text-xs lg:text-sm">CSV Intelligence & Visualization</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-6 space-y-4 shadow-xl">
              <h3 className="font-bold flex items-center space-x-2 text-sm lg:text-base">
                <DocumentArrowUpIcon className="w-5 h-5 text-indigo-400" />
                <span>Upload Dataset</span>
              </h3>
              <div className="relative border-2 border-dashed border-slate-800 rounded-xl lg:rounded-2xl p-6 lg:p-8 hover:border-indigo-500/50 transition-all text-center group cursor-pointer">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <TableCellsIcon className="w-8 h-8 lg:w-10 lg:h-10 text-slate-700 mx-auto mb-2 group-hover:text-indigo-500/50 transition-colors" />
                <p className="text-xs lg:text-sm text-slate-500">{csvContent ? 'File uploaded!' : 'Drop CSV here'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Analysis Objective</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 lg:p-4 h-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-slate-200"
                  placeholder="What should I find?"
                />
              </div>
              <button
                onClick={runAnalysis}
                disabled={!csvContent || isLoading}
                className="w-full py-3 lg:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 text-sm lg:text-base"
              >
                {isLoading ? "Thinking..." : "Run Analysis"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {analysis ? (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <ChartBarIcon className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                    <h3 className="text-lg lg:text-xl font-bold">Analysis Summary</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm lg:text-base whitespace-pre-wrap">{analysis.summary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {analysis.insights.map((insight: string, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-xs lg:text-sm text-slate-400">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {analysis.chartData && analysis.chartData.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-8 h-[350px] lg:h-[400px] shadow-2xl">
                    <h3 className="text-base lg:text-lg font-bold mb-4 lg:mb-6">Data Visualization</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                          cursor={{ fill: '#ffffff08' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {analysis.chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full min-h-[300px] lg:min-h-auto border-2 border-dashed border-slate-800 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center p-8 lg:p-12 text-center bg-slate-900/20">
                <ChartBarIcon className="w-12 h-12 lg:w-16 lg:h-16 text-slate-800 mb-4" />
                <h3 className="text-lg lg:text-xl font-bold text-slate-700">No Analysis Results</h3>
                <p className="text-slate-600 max-w-xs text-xs lg:text-sm mt-2">Upload a CSV and provide a prompt to generate insights and charts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
