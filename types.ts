export enum View {
  CHAT = 'CHAT',
  FACE_RECOGNITION = 'FACE_RECOGNITION',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
}

export interface TranscriptMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  topic: string;
  information: string;
}
