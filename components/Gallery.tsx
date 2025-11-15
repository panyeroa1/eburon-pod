
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Image, Download, Trash2 } from 'lucide-react';
import { getUserImages, deleteImage } from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';

interface UserImage {
    id: number;
    prompt: string;
    url: string;
    createdAt: string;
    storage_path: string;
}

const Gallery: React.FC = () => {
    const [images, setImages] = useState<UserImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchImages = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const userImages = await getUserImages(user.id);
            setImages(userImages);
        } catch (err: any) {
            setError(`Failed to load gallery: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleDelete = async (image: UserImage) => {
        if (!user || !window.confirm("Are you sure you want to delete this image?")) return;

        try {
            await deleteImage(user.id, image.storage_path);
            setImages(currentImages => currentImages.filter(img => img.id !== image.id));
        } catch (err: any) {
            alert(`Failed to delete image: ${err.message}`);
        }
    };

    const handleDownload = (url: string, prompt: string) => {
        const link = document.createElement('a');
        link.href = url;
        const fileName = prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'gemini_image';
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                    <p className="mt-4 text-gray-400">Loading your gallery...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <AlertTriangle className="h-12 w-12 text-red-400" />
                    <p className="mt-4 text-red-400">{error}</p>
                    <button onClick={fetchImages} className="mt-4 px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">Try Again</button>
                </div>
            );
        }

        if (images.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <Image className="h-16 w-16 text-gray-600" />
                    <p className="mt-4 text-gray-400">Your gallery is empty.</p>
                    <p className="text-gray-500 text-sm">Use the Image Generation or Editor tools and click "Save Image" to add to your gallery.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map(image => (
                    <div key={image.id} className="group relative aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                        <img src={image.url} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
                                <p className="text-sm font-semibold truncate" title={image.prompt}>{image.prompt}</p>
                                <p className="text-xs text-slate-300">{new Date(image.createdAt).toLocaleDateString()}</p>
                            </div>
                             <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <button onClick={() => handleDownload(image.url, image.prompt)} className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-600 text-white" aria-label="Download image">
                                    <Download size={16} />
                                </button>
                                <button onClick={() => handleDelete(image)} className="p-2 bg-red-700/50 rounded-full hover:bg-red-600 text-white" aria-label="Delete image">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900">
            <header className="p-4 border-b border-slate-800">
                <h2 className="text-xl font-semibold">My Gallery</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default Gallery;
