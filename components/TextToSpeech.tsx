
import React, { useState, useCallback, useRef } from 'react';
import { Volume2, Loader2, Play, Pause } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

// Audio decoding functions from Gemini documentation
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('Hello! I am a friendly AI assistant powered by Gemini. You can type anything here and I will read it aloud for you.');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleSpeak = useCallback(async () => {
    if (!text.trim()) {
      setError("Please enter some text to speak.");
      return;
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.close();
    }
    
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    try {
      const base64Audio = await generateSpeech(text);
      const audioData = decode(base64Audio);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
          setIsPlaying(false);
          audioContext.close();
      };
      source.start();
      
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (err) {
      setError("Failed to generate speech. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const stopPlayback = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    setIsPlaying(false);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Text to Speech</h2>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            <div className="text-center">
                <Volume2 size={64} className="mx-auto text-cyan-400" />
                <p className="mt-4 text-gray-400">Convert text into natural-sounding speech.</p>
            </div>
          <div>
            <label htmlFor="tts-text" className="block text-sm font-medium text-gray-400 mb-2">Text to Speak</label>
            <textarea
              id="tts-text"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {isPlaying ? (
              <button
                onClick={stopPlayback}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                  <Pause className="h-5 w-5" /> Stop
              </button>
          ) : (
            <button
                onClick={handleSpeak}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Speak
            </button>
          )}

          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
