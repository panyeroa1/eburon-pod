
import React, { useState, useCallback } from 'react';
import { Image, Loader2, Save } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { saveImage } from '../services/supabaseService';


const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageBytes = await generateImage(prompt, aspectRatio);
      setGeneratedImage(imageBytes); // Store base64 bytes directly
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  const handleSave = async () => {
    if (!generatedImage || !user) return;
    setIsSaving(true);
    setError(null);
    try {
        await saveImage(user.id, prompt, generatedImage);
        alert('Image saved to your gallery!');
    } catch (err: any) {
        setError(`Failed to save image: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Image Generation</h2>
      </header>
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-hidden">
        {/* Controls */}
        <div className="md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">Prompt</label>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map(ar => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-2 px-3 text-sm rounded-md transition-colors ${
                    aspectRatio === ar ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
            Generate Image
          </button>
           {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Image Display */}
        <div className="md:w-2/3 flex-1 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center p-4 border border-slate-800 relative">
          {isLoading && (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
              <p className="mt-4 text-gray-400">Generating your masterpiece...</p>
            </div>
          )}
          {!isLoading && generatedImage && (
            <>
              <img src={`data:image/jpeg;base64,${generatedImage}`} alt={prompt} className="max-w-full max-h-full object-contain rounded-md" />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="absolute bottom-4 right-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-800"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Image
              </button>
            </>
          )}
          {!isLoading && !generatedImage && (
            <div className="text-center text-gray-500">
              <Image size={64} className="mx-auto" />
              <p className="mt-4">Your generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
