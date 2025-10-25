import React, { useState, useCallback, useRef } from 'react';
import { findInDocument } from './services/geminiService';

// TypeScript declarations for libraries loaded from CDN
declare const pdfjsLib: any;
declare const mammoth: any;

const Header: React.FC = () => (
  <header className="w-full text-center py-6">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
      DocuSearch AI
    </h1>
    <p className="text-slate-400 mt-2">Votre assistant de recherche intelligent pour la documentation technique</p>
  </header>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center pt-8">
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-slate-400">Analyse du document...</p>
        </div>
    </div>
);

interface FileUploadProps {
  setDocumentation: (doc: string) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ setDocumentation, fileName, setFileName }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setDocumentation('');
        setFileName(null);
        setParseError(null);
        setIsParsing(true);

        try {
            const reader = new FileReader();

            if (file.type === 'application/pdf') {
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                        }
                        setDocumentation(fullText);
                        setFileName(file.name);
                    } catch (err) {
                        console.error("Error parsing PDF:", err);
                        setParseError("Impossible de lire le fichier PDF. Il est peut-être corrompu.");
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        setDocumentation(result.value);
                        setFileName(file.name);
                    } catch (err) {
                        console.error("Error parsing DOCX:", err);
                        setParseError("Impossible de lire le fichier DOCX.");
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else { // Plain text fallback
                reader.onload = (e) => {
                    setDocumentation(e.target?.result as string);
                    setFileName(file.name);
                    setIsParsing(false);
                };
                reader.readAsText(file);
            }
        } catch (err) {
            console.error("Error handling file:", err);
            setParseError("Une erreur inattendue est survenue lors du traitement du fichier.");
            setIsParsing(false);
        }
    };

    const handleRemoveFile = () => {
        setDocumentation('');
        setFileName(null);
        setParseError(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">
                Étape 1: Téléchargez votre manuel technique
            </h2>
            {isParsing ? (
                 <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    <p className="mt-4 text-slate-400">Traitement du fichier...</p>
                 </div>
            ) : fileName ? (
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-md">
                    <span className="text-slate-300 truncate" aria-label={`Fichier chargé: ${fileName}`}>{fileName}</span>
                    <button onClick={handleRemoveFile} className="ml-4 text-slate-400 hover:text-white transition-colors" aria-label="Supprimer le fichier">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <>
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez</p>
                            <p className="text-xs text-slate-500">PDF, DOCX, TXT, MD, etc.</p>
                        </div>
                    </label>
                    <input id="file-upload" ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt,.md,.json,.html,.xml,text/plain" />
                </>
            )}
            {parseError && <p className="text-sm text-red-400 mt-2">{parseError}</p>}
        </div>
    );
};

export default function App() {
  const [documentation, setDocumentation] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
      if (!query.trim() || !documentation.trim()) {
          setError("Veuillez télécharger un document et poser une question.");
          return;
      }
      setIsLoading(true);
      setError(null);
      setResults('');

      try {
          const response = await findInDocument(documentation, query);
          setResults(response);
      } catch (err) {
          setError("Une erreur s'est produite lors de la communication avec l'API. Veuillez réessayer.");
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }, [query, documentation]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <Header />
      <main className="w-full max-w-4xl flex flex-col gap-8 mt-8">
        
        <FileUpload 
          setDocumentation={setDocumentation} 
          fileName={fileName}
          setFileName={setFileName}
        />

        <div className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-lg flex flex-col space-y-4">
            <div className="flex flex-col space-y-3">
                <label htmlFor="search-query" className="text-lg font-semibold text-slate-300">
                    Étape 2: Posez votre question
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                        id="search-query"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Ex: Comment configurer la base de données ?"
                        className="flex-grow p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!documentation.trim()}
                        aria-disabled={!documentation.trim()}
                        aria-label="Zone de saisie de la question"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!documentation.trim() || !query.trim() || isLoading}
                        className="flex items-center justify-center px-6 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Lancer la recherche"
                    >
                        <SearchIcon className="h-5 w-5 mr-2" />
                        Rechercher
                    </button>
                </div>
            </div>

            <div className="flex flex-col space-y-3">
                <h3 className="text-lg font-semibold text-slate-300">Résultats</h3>
                <div className="w-full min-h-[24rem] p-4 bg-slate-900/70 border border-slate-700 rounded-lg overflow-y-auto">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>
                    ) : results ? (
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">{results}</div>
                    ) : (
                        <div className="text-slate-500 text-center pt-8">
                            Les résultats de votre recherche apparaîtront ici.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}