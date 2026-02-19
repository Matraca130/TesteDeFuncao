// Axon v4.4 — Types: Keyword Popup + AI Chat
import type { Keyword, SubTopic } from './types-core';

export interface KeywordPopupData { keyword: Keyword; subtopics: SubTopic[]; subtopic_states: SubTopicState[]; related_keywords: Keyword[]; chat_history: AIChatHistory | null; flashcard_count: number; quiz_count: number; }
export interface SubTopicState { subtopic_id: string; mastery: 'none' | 'learning' | 'known'; }
export interface AIChatHistory { keyword_id: string; messages: AIChatMessage[]; }
export interface AIChatMessage { role: 'user' | 'assistant'; content: string; timestamp: string; }
