const FILLER_WORD_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\blike\b/gi,
  /\byou know\b/gi,
  /\bso\b/gi,
  /\bactually\b/gi,
  /\bbasically\b/gi,
  /\bright\b/gi,
  /\bokay\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
];

export function countFillerWords(transcript: string): number {
  let count = 0;
  for (const pattern of FILLER_WORD_PATTERNS) {
    const matches = transcript.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

export function calculateSpeakingPace(transcript: string, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  return Math.round((words.length / durationSeconds) * 60);
}

export function calculateVocabDiversity(transcript: string): number {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 0;

  const unique = new Set(words);
  return Math.round((unique.size / words.length) * 100) / 100;
}

export function getFillerWordBreakdown(transcript: string): Record<string, number> {
  const breakdown: Record<string, number> = {};
  const labels: [RegExp, string][] = [
    [/\bum+\b/gi, 'um'],
    [/\buh+\b/gi, 'uh'],
    [/\blike\b/gi, 'like'],
    [/\byou know\b/gi, 'you know'],
    [/\bso\b/gi, 'so'],
    [/\bactually\b/gi, 'actually'],
    [/\bbasically\b/gi, 'basically'],
  ];

  for (const [pattern, label] of labels) {
    const matches = transcript.match(pattern);
    if (matches && matches.length > 0) {
      breakdown[label] = matches.length;
    }
  }

  return breakdown;
}

export function getPaceLabel(wpm: number): { label: string; color: string } {
  if (wpm < 100) return { label: 'Too Slow', color: '#FFC107' };
  if (wpm < 130) return { label: 'Slow', color: '#FF9800' };
  if (wpm >= 130 && wpm <= 170) return { label: 'Ideal', color: '#4CAF50' };
  if (wpm > 170 && wpm <= 190) return { label: 'Fast', color: '#FF9800' };
  return { label: 'Too Fast', color: '#F44336' };
}
