
export type ModuleType = 'chat' | 'vision' | 'media' | 'data' | 'agent' | 'live';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DataRecord {
  [key: string]: any;
}

export interface AgentStep {
  step: number;
  task: string;
  description: string;
  status: 'pending' | 'running' | 'completed';
}
