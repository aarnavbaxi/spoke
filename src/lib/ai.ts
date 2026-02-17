const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_BASE = 'https://api.groq.com/openai/v1';

export interface AIResult {
  transcript: string;
  feedback: string;
}

const FALLBACK_PROMPTS = [
  'Describe your ideal weekend in detail.',
  'Explain your favorite hobby to someone who has never heard of it.',
  'Talk about a recent challenge you overcame.',
  'Describe a person who has had a significant impact on your life.',
  'Explain a topic you are passionate about.',
];

function isMissingKey() {
  return !GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE';
}

async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'text');

  const response = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq transcription error ${response.status}: ${err}`);
  }

  return (await response.text()).trim();
}

async function getAIFeedback(
  transcript: string,
  sessionMode: string,
  prompt?: string
): Promise<string> {
  const context = prompt
    ? `The speaker was responding to this prompt: "${prompt}".`
    : `This was a ${sessionMode} speaking practice session.`;

  const userMessage = `${context}

Here is the transcript:
"${transcript}"

Provide 2-3 paragraphs of personalized, actionable feedback on the speaker's public speaking skills. Cover: vocabulary use, filler words, speaking clarity, pacing, confidence, and specific improvement suggestions. Be encouraging but direct.`;

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert public speaking coach. Analyze speech transcripts and provide concise, actionable, and encouraging feedback.',
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq chat error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? 'Analysis complete.';
}

export async function transcribeAndAnalyze(
  audioUri: string,
  durationSeconds: number,
  sessionMode: 'freeform' | 'interview' | 'custom',
  prompt?: string
): Promise<AIResult> {
  if (isMissingKey()) {
    return {
      transcript: '[Add your Groq API key to .env to enable transcription]',
      feedback:
        'AI feedback is unavailable. Set EXPO_PUBLIC_GROQ_API_KEY in your .env file to enable this feature.',
    };
  }

  const transcript = await transcribeAudio(audioUri);
  const feedback = await getAIFeedback(transcript, sessionMode, prompt);

  return { transcript, feedback };
}

export async function generateSpeakingPrompt(): Promise<string> {
  if (isMissingKey()) {
    return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
  }

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content:
            'Generate a single interesting speaking prompt for a 2-3 minute public speaking practice session. Return only the prompt text, nothing else.',
        },
      ],
      max_tokens: 80,
    }),
  });

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content?.trim() ??
    FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]
  );
}
