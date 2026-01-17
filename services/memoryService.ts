
export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  timestamp: number;
}

const SESSIONS_KEY = 'nexus_ultra_chat_sessions';
const ACTIVE_SESSION_ID_KEY = 'nexus_ultra_active_session_id';

/**
 * Strips large base64 data from messages to save space in localStorage.
 * Text content is preserved, but heavy visual data is removed for long-term storage
 * if it exceeds limits.
 */
const sanitizeSessions = (sessions: ChatSession[]): ChatSession[] => {
  return sessions.map(session => ({
    ...session,
    messages: session.messages.map(msg => {
      // If message has images, we keep the flag but remove the heavy data 
      // for older messages if needed. For now, let's keep only text to stay safe.
      const sanitized = { ...msg };
      if (sanitized.imageUrl && sanitized.imageUrl.length > 100000) {
        sanitized.imageUrl = "[Image stored in session only]";
      }
      if (sanitized.imageUrls) {
        sanitized.imageUrls = sanitized.imageUrls.map(() => "[Image stored in session only]");
      }
      return sanitized;
    })
  })).slice(0, 20); // Keep only last 20 sessions
};

export const saveSessionsToMemory = (sessions: ChatSession[]) => {
  try {
    const data = JSON.stringify(sessions);
    localStorage.setItem(SESSIONS_KEY, data);
  } catch (error) {
    console.warn("Storage quota exceeded, attempting to save sanitized version...");
    try {
      // If it fails, save a version without images
      const sanitizedData = JSON.stringify(sanitizeSessions(sessions));
      localStorage.setItem(SESSIONS_KEY, sanitizedData);
    } catch (finalError) {
      console.error("Critical: Failed to save sessions even after sanitization.", finalError);
    }
  }
};

export const loadSessionsFromMemory = (): ChatSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return [];
  }
};

export const saveActiveSessionId = (id: string) => {
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch (e) {}
};

export const getActiveSessionId = (): string | null => {
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
};

export const clearAllSessions = () => {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
};
