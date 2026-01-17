
import React, { useState } from 'react';
import { QueueListIcon, BeakerIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getGeminiClient } from '../services/geminiService';
import { Type } from '@google/genai';

export default function AgentPlanner() {
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const planTask = async () => {
    if (!goal.trim() || isPlanning) return;
    setIsPlanning(true);
    setSteps([]);

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I want to achieve this goal: "${goal}". Break this down into 5-8 logical, actionable steps for an AI agent.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                description: { type: Type.STRING },
                tool: { type: Type.STRING, description: "Tool suggested: Search, Code, Design, Write, etc." }
              },
              required: ["task", "description"]
            }
          }
        }
      });

      const parsedSteps = JSON.parse(response.text || '[]');
      setSteps(parsedSteps);
    } catch (err) {
      alert("Planning failed.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-lg lg:text-xl font-bold">Autonomous Agent</h2>
        <p className="text-slate-400 text-xs lg:text-sm">Reasoning & Strategic Planning</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8 lg:space-y-12 pb-24 lg:pb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-2">
            <BeakerIcon className="w-6 h-6 lg:w-8 lg:h-8 text-amber-500" />
            <h3 className="text-xl lg:text-2xl font-bold">What's your objective?</h3>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., 'Plan a 7-day trip to Japan'"
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm lg:text-base text-slate-100"
            />
            <button
              onClick={planTask}
              disabled={!goal.trim() || isPlanning}
              className="px-6 lg:px-8 py-3 lg:py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl lg:rounded-2xl font-bold transition-all shadow-lg shadow-amber-600/30 disabled:opacity-50 text-sm lg:text-base flex items-center justify-center"
            >
              {isPlanning ? <ArrowPathIcon className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" /> : "Plan Steps"}
            </button>
          </div>
        </div>

        {steps.length > 0 && (
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-xs lg:text-sm font-bold text-slate-500 flex items-center space-x-2 uppercase tracking-widest px-1">
              <QueueListIcon className="w-4 h-4" />
              <span>Agent Workflow Plan</span>
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl lg:rounded-2xl p-4 lg:p-6 flex items-start space-x-3 lg:space-x-4 group hover:border-amber-500/30 transition-all shadow-md">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold border border-slate-700 text-xs lg:text-base">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-200 text-sm lg:text-base truncate">{step.task}</h4>
                      <span className="text-[8px] lg:text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">
                        {step.tool || 'General'}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-400 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                  <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700 group-hover:text-emerald-500 transition-colors flex-shrink-0 hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
