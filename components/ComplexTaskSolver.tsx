
import React, { useState, useCallback } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { solveComplexTask } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ComplexTaskSolver: React.FC = () => {
  const [prompt, setPrompt] = useState('Write a short story about a robot who discovers music for the first time. The story should explore themes of consciousness and art. End on a poignant note.');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for the complex task.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await solveComplexTask(prompt);
      setResult(response);
    } catch (err) {
      setError("An error occurred while processing the task. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <header className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-semibold">Complex Task Solver (Pro Model)</h2>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6 overflow-hidden">
        {/* Controls */}
        <div className="lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">Complex Prompt</label>
            <textarea
              id="prompt"
              rows={10}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a complex task, e.g., 'Explain the theory of relativity as if I'm a five-year-old', 'Write Python code for a web scraper...'"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleSolve}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-slate-600"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
            Solve with Gemini Pro
          </button>
           {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Result Display */}
        <div className="lg:w-2/3 flex-1 bg-slate-950/50 rounded-lg flex flex-col border border-slate-800 overflow-hidden">
          {isLoading && (
            <div className="m-auto text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
              <p className="mt-4 text-gray-400">Gemini Pro is thinking...</p>
              <p className="text-sm text-gray-500">(This may take a moment for complex tasks)</p>
            </div>
          )}
          {!isLoading && result && (
            <div className="p-4 md:p-6 overflow-y-auto prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          )}
          {!isLoading && !result && (
            <div className="m-auto text-center text-gray-500">
              <BrainCircuit size={64} className="mx-auto" />
              <p className="mt-4">The solution will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplexTaskSolver;
