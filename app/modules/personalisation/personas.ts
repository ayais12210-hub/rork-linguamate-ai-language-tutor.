export type Persona = {
  code: 'BEGINNER_FAST_TRACK' | 'BUSY_MICROSESSIONS' | 'PRONUNCIATION_FOCUS';
  label: string;
  description: string;
};

export const PERSONAS: Persona[] = [
  {
    code: 'BEGINNER_FAST_TRACK',
    label: 'Beginner Fast Track',
    description: 'Beginner level with high time budget; prioritise scaffolded progression and more new material each day.'
  },
  {
    code: 'BUSY_MICROSESSIONS',
    label: 'Busy Microsessions',
    description: 'Low time budget or often offline; focus on 3–5 minute lessons and lighter reviews.'
  },
  {
    code: 'PRONUNCIATION_FOCUS',
    label: 'Pronunciation Focus',
    description: 'Emphasise speaking drills with lenient ASR and natural TTS pacing.'
  }
];
