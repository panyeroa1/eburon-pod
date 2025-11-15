
import React, { useState, useMemo } from 'react';
import { Sparkles, MessageSquare, Image, Edit, Search, Volume2, Mic, BrainCircuit, Bot, LayoutGrid, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { supabase } from './services/supabaseClient';

import AuthComponent from './components/Auth';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import ImageAnalyzer from './components/ImageAnalyzer';
import GroundingSearch from './components/GroundingSearch';
import TextToSpeech from './components/TextToSpeech';
import AudioTranscriber from './components/AudioTranscriber';
import ComplexTaskSolver from './components/ComplexTaskSolver';
import Gallery from './components/Gallery';

type Feature = 'chatbot' | 'image-generator' | 'image-editor' | 'image-analyzer' | 'grounding-search' | 'tts' | 'transcriber' | 'complex-solver' | 'gallery';

const AppContent: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('chatbot');
  const { user } = useAuth();

  const features = useMemo(() => [
    { id: 'chatbot', name: 'AI Chatbot', icon: MessageSquare, component: <Chatbot /> },
    { id: 'image-generator', name: 'Image Generation', icon: Image, component: <ImageGenerator /> },
    { id: 'image-editor', name: 'Image Editor', icon: Edit, component: <ImageEditor /> },
    { id: 'gallery', name: 'My Gallery', icon: LayoutGrid, component: <Gallery /> },
    { id: 'image-analyzer', name: 'Image Analysis', icon: Sparkles, component: <ImageAnalyzer /> },
    { id: 'grounding-search', name: 'Grounding Search', icon: Search, component: <GroundingSearch /> },
    { id: 'tts', name: 'Text to Speech', icon: Volume2, component: <TextToSpeech /> },
    { id: 'transcriber', name: 'Audio Transcriber', icon: Mic, component: <AudioTranscriber /> },
    { id: 'complex-solver', name: 'Complex Task Solver', icon: BrainCircuit, component: <ComplexTaskSolver /> },
  ], []);

  const activeComponent = useMemo(() => {
    const feature = features.find(f => f.id === activeFeature);
    return feature ? feature.component : null;
  }, [activeFeature, features]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-gray-200 font-sans">
      <nav className="w-16 md:w-64 bg-slate-950/70 p-2 md:p-4 flex flex-col border-r border-slate-800">
        <div className="flex items-center md:justify-center mb-8 px-2">
          <img src="https://eburon.vercel.app/logo-dark.png" alt="EBURON AI Logo" className="h-10 w-auto" />
        </div>
        <ul className="space-y-2 flex-1">
          {features.map((feature) => (
            <li key={feature.id}>
              <button
                onClick={() => setActiveFeature(feature.id as Feature)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeFeature === feature.id
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <feature.icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden md:block">{feature.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
            <div className="border-t border-slate-800 -mx-2 md:-mx-4 my-2"></div>
            <div className="hidden md:block px-2 mb-2">
                <p className="text-sm text-slate-400 truncate">Signed in as:</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
             <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-400 text-slate-400"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="hidden md:block">Logout</span>
              </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeComponent}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

const AuthWrapper: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="text-xl text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthComponent />;
  }

  return <AppContent />;
};

export default App;
