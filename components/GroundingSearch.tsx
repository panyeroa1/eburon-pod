
import React, { useState, useCallback, useEffect } from 'react';
import { Search, Map, Loader2, Link as LinkIcon } from 'lucide-react';
import { performGroundedSearch } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import type { GroundingChunk } from '@google/genai';

type SearchTool = 'googleSearch' | 'googleMaps';

const GroundingSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchTool, setSearchTool] = useState<SearchTool>('googleSearch');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    if (searchTool === 'googleMaps') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.warn(`Could not get location: ${err.message}`);
          setError("Location access is needed for Maps search. Please enable it in your browser settings.");
        }
      );
    }
  }, [searchTool]);


  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
        setError("Please enter a query.");
        return;
    }
    if (searchTool === 'googleMaps' && !location) {
        setError("Location is required for Maps search. Please allow location access.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSources([]);

    try {
      const { text, chunks } = await performGroundedSearch(query, searchTool, location || undefined);
      setResult(text);
      setSources(chunks);
    } catch (err) {
      setError("Failed to perform search. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchTool, location]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Grounding Search</h2>
      </header>
      <div className="flex flex-col flex-1 p-4 md:p-6 gap-4 overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Who won the latest F1 race?"
            className="flex-grow bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="flex gap-2">
            <button
                onClick={() => setSearchTool('googleSearch')}
                className={`py-2 px-4 text-sm rounded-md flex items-center gap-2 transition-colors ${
                    searchTool === 'googleSearch' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
                }`}
            >
                <Search size={16} /> Web
            </button>
            <button
                onClick={() => setSearchTool('googleMaps')}
                className={`py-2 px-4 text-sm rounded-md flex items-center gap-2 transition-colors ${
                    searchTool === 'googleMaps' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
                }`}
            >
                <Map size={16} /> Maps
            </button>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Search
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {/* Result */}
        <div className="flex-1 bg-slate-950/50 rounded-lg flex flex-col p-4 border border-slate-800 overflow-y-auto">
           {isLoading && (
            <div className="m-auto text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
              <p className="mt-4 text-gray-400">Searching...</p>
            </div>
          )}
          {!isLoading && result && (
             <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
                {sources.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-300">Sources</h3>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {sources.map((chunk, i) => {
                                const uri = chunk.web?.uri || chunk.maps?.uri;
                                const title = chunk.web?.title || chunk.maps?.title;
                                if (!uri) return null;
                                return (
                                    <li key={i}>
                                        <a href={uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                            {title || uri}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
             </div>
          )}
          {!isLoading && !result && (
            <div className="m-auto text-center text-gray-500">
              <Search size={64} className="mx-auto" />
              <p className="mt-4">Search results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroundingSearch;
