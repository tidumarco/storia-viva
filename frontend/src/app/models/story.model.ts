export interface Speaker {
  id: string;
  name: string;
  voice_id: string;
}

export interface Turn {
  speaker_id: string;
  text: string;
  gap?: 'interject' | 'short' | 'mid' | 'long' | 'very_long';
}

export interface TimelineEntry {
  t: number;
  speaker: string;
  text: string;
}

export interface GenerateRequest {
  title: string;
  text: string;
  speakers?: Speaker[];
  language?: string;
}

export interface GenerateResponse {
  id: string;
  title: string;
  audioUrl: string;
  timeline: TimelineEntry[];
  speakers: Speaker[];
  turns: Turn[];
  durationEstimate: number;
  language: string;
  mode: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  language: string;
}
