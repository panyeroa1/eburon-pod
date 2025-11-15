
import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, Loader2, UploadCloud } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('What is in this image?');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim() || !imageFile) {
      setError("Please provide an image and a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeImage(prompt, imageFile);
      setAnalysisResult(result);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Image Analysis</h2>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 overflow-hidden">
        {/* Input and Controls */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div 
                className="relative border-2 border-dashed border-slate-700 rounded-lg h-64 flex flex-col items-center justify-center text-gray-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                {imagePreview ? (
                     <img src={imagePreview} alt="To be analyzed" className="max-h-full max-w-full object-contain rounded-md" />
                ) : (
                    <>
                        <UploadCloud size={48} />
                        <p className="mt-2">Click to upload an image</p>
                    </>
                )}
            </div>
            <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">Question</label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is in this image? Describe the main subject."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !imageFile || !prompt}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Analyze Image
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Analysis Result */}
        <div className="bg-slate-950/50 rounded-lg flex flex-col p-4 border border-slate-800 overflow-y-auto">
          {isLoading && (
            <div className="m-auto text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
              <p className="mt-4 text-gray-400">Analyzing image...</p>
            </div>
          )}
          {!isLoading && analysisResult && (
             <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
             </div>
          )}
          {!isLoading && !analysisResult && (
            <div className="m-auto text-center text-gray-500">
              <Sparkles size={64} className="mx-auto" />
              <p className="mt-4">The analysis result will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
