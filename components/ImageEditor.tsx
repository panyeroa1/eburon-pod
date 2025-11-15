
import React, { useState, useCallback, useRef } from 'react';
import { Edit, Loader2, UploadCloud, Save } from 'lucide-react';
import { editImage } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { saveImage } from '../services/supabaseService';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImage(file);
      setOriginalImagePreview(URL.createObjectURL(file));
      setEditedImage(null);
      setError(null);
    }
  };

  const handleEdit = useCallback(async () => {
    if (!prompt.trim() || !originalImage) {
      setError("Please provide an image and a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const imageBytes = await editImage(prompt, originalImage);
      setEditedImage(imageBytes); // Store base64 string
    } catch (err) {
      setError("Failed to edit image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, originalImage]);
  
  const handleSave = async () => {
    if (!editedImage || !user) return;
    setIsSaving(true);
    setError(null);
    try {
        await saveImage(user.id, prompt, editedImage);
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
        <h2 className="text-xl font-semibold">Image Editor</h2>
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
                {originalImagePreview ? (
                     <img src={originalImagePreview} alt="Original" className="max-h-full max-w-full object-contain rounded-md" />
                ) : (
                    <>
                        <UploadCloud size={48} />
                        <p className="mt-2">Click to upload an image</p>
                    </>
                )}
            </div>
            <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">Editing Prompt</label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a retro filter, make the sky purple"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleEdit}
            disabled={isLoading || !originalImage || !prompt}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit className="h-5 w-5" />}
            Apply Edit
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Edited Image Display */}
        <div className="bg-slate-950/50 rounded-lg flex items-center justify-center p-4 border border-slate-800 relative">
          {isLoading && (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
              <p className="mt-4 text-gray-400">Applying your edits...</p>
            </div>
          )}
          {!isLoading && editedImage && (
            <>
              <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="max-w-full max-h-full object-contain rounded-md" />
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
          {!isLoading && !editedImage && (
            <div className="text-center text-gray-500">
              <Edit size={64} className="mx-auto" />
              <p className="mt-4">Your edited image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
