import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, Check, AlertTriangle } from 'lucide-react';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [statusText, setStatusText] = useState('Click the mic to start recording');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // FIX: Use `any` type for the ref because SpeechRecognition is not a standard part of the TypeScript DOM library.
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    // FIX: Cast `window` to `any` to access the non-standard SpeechRecognition API properties.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + final);
        setInterimTranscript(interim);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        setIsSpeaking(false);
        setStatusText('Click the mic to start recording');
      };

      recognition.onerror = (event: any) => {
        let errorMessage = `Speech recognition error: ${event.error}`;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMessage = "Microphone access denied. Please enable it in your browser settings.";
        } else if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please try again.";
        }
        setError(errorMessage);
        setIsRecording(false);
        setIsSpeaking(false);
        setStatusText('Click the mic to start recording');
      };
      
      recognition.onspeechstart = () => {
        setIsSpeaking(true);
        setStatusText('Speech detected...');
      };
      
      recognition.onspeechend = () => {
        setIsSpeaking(false);
        setStatusText('Processing...');
      };


      recognitionRef.current = recognition;
    } else {
        setError("Speech Recognition API is not supported in this browser.");
        setStatusText('Transcription not supported');
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    
    setError(null);
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
      setStatusText('Listening...');
    }
  };
  
  const handleCopy = () => {
    if (!transcript && !interimTranscript) return;
    navigator.clipboard.writeText(transcript + interimTranscript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Audio Transcriber</h2>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 gap-6">
        <button
          onClick={toggleRecording}
          disabled={!recognitionRef.current}
          className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500/20' : 'bg-cyan-500/20'}`}
        >
          {isSpeaking && <div className={`absolute inset-0 rounded-full animate-ping bg-cyan-400`}></div>}
          <div className="relative z-10 h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center">
            {isRecording ? <MicOff className="h-10 w-10 text-red-500" /> : <Mic className="h-10 w-10 text-cyan-400" />}
          </div>
        </button>
        <p className="text-gray-400 h-5">
            {statusText}
        </p>

        {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md p-3 flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
            </div>
        )}

        <div className="w-full max-w-3xl h-64 bg-slate-950/50 rounded-lg p-4 border border-slate-800 overflow-y-auto relative">
          <p className="whitespace-pre-wrap text-gray-300">
            {transcript}
            <span className="text-gray-500">{interimTranscript}</span>
          </p>
          <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-slate-700/50 hover:bg-slate-700 text-gray-400 hover:text-white disabled:opacity-50" disabled={!transcript && !interimTranscript}>
            {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16}/>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioTranscriber;