
import React, { useState, useCallback, useRef } from 'react';
import type { Article } from './types';
import { filterSupernaturalArticles } from './services/geminiService';
import Loader from './components/Loader';
import ResultsTable from './components/ResultsTable';
import Header from './components/Header';

const BATCH_SIZE = 200;

// Helper function defined outside the component to avoid re-creation
const parseCSV = (csvText: string): Article[] => {
    const rows = csvText.trim().split('\n');
    if (rows.length < 1) return [];
    
    // Simple header detection based on common terms
    const header = rows[0].toLowerCase();
    const hasHeader = header.includes('title') || header.includes('author') || header.includes('日期');
    
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows.map(row => {
        const columns = row.split(',');
        return {
            title: columns[0] || '',
            author: columns[1] || '',
            date: columns[2] || '',
        };
    }).filter(article => article.title && article.title.trim() !== ''); // Ensure article has a non-empty title
};


const App: React.FC = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsAnalyzed(false);
      setFilteredArticles([]);
      setError(null);
      setAllArticles([]);
      setFileName('');

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
            setError("File is empty or could not be read.");
            return;
        }
        try {
          const parsedArticles = parseCSV(text);
          if (parsedArticles.length === 0) {
            setError("Could not find any articles in the file. Please ensure the CSV format is 'Title,Author,日期' and the file is not empty.");
          } else {
            setAllArticles(parsedArticles);
            setFileName(file.name);
          }
        } catch (err) {
          setError("Error parsing CSV file. Please ensure it is a valid CSV file with UTF-8 encoding.");
          console.error(err);
        }
      };
      reader.onerror = () => {
        setError("An error occurred while reading the file.");
      };
      reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyze = useCallback(async () => {
    if (allArticles.length === 0) {
      setError("No articles to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFilteredArticles([]);
    setIsAnalyzed(false);

    const totalBatches = Math.ceil(allArticles.length / BATCH_SIZE);
    let allFilteredTitles = new Set<string>();

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = allArticles.slice(start, end);
        
        setProgress({ current: i + 1, total: totalBatches });

        const filteredTitles = await filterSupernaturalArticles(batch);
        filteredTitles.forEach(title => allFilteredTitles.add(title));
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const results = allArticles.filter(article => allFilteredTitles.has(article.title));
      setFilteredArticles(results);
      setIsAnalyzed(true);

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [allArticles]);

  const handleReset = () => {
    setIsAnalyzed(false);
    setFilteredArticles([]);
    setError(null);
    setAllArticles([]);
    setFileName('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (filteredArticles.length === 0) return;

    const csvHeader = 'Title,Author,日期\n';
    const csvRows = filteredArticles.map(article => 
      [article.title, article.author, article.date]
        .map(field => `"${(field || '').replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_supernatural_articles.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderInitialView = () => (
    <div className="text-center bg-gray-800/50 p-8 rounded-xl shadow-2xl backdrop-blur-md border border-gray-700 w-full max-w-xl">
      <h2 className="text-2xl font-semibold mb-2 text-white">上传要分析的文件</h2>
      <p className="text-gray-400 mb-6">
        请选择一个CSV文件进行分析。文件格式应包含三列：<br />
        <code className="text-sm bg-gray-900 px-2 py-1 rounded">Title,Author,日期</code>
      </p>
      <label htmlFor="file-upload" className="w-full cursor-pointer group">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-10 hover:border-purple-400 hover:bg-gray-800 transition-colors duration-300 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-lg font-semibold text-purple-400">点击此处选择文件</p>
            <p className="text-sm text-gray-500 mt-1">或将文件拖放到这里</p>
        </div>
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
    </div>
  );

  const renderReadyView = () => (
      <div className="text-center bg-gray-800/50 p-8 rounded-xl shadow-2xl backdrop-blur-md border border-gray-700">
        <h2 className="text-2xl font-semibold mb-2 text-white">准备开始分析</h2>
        <p className="text-gray-400 mb-6">
          文件 <span className="font-semibold text-purple-300">{fileName}</span> 已加载，共找到 {allArticles.length} 篇文章。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
            <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? '分析中...' : `开始分析`}
            </button>
             <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-colors duration-200"
            >
                上传其他文件
            </button>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative w-full mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!isAnalyzed && !isLoading && (
             allArticles.length === 0 ? renderInitialView() : renderReadyView()
          )}
          
          {isLoading && (
             <Loader message={`正在分析... (${progress.current} / ${progress.total}批次)`} />
          )}

          {isAnalyzed && !isLoading && (
            <div className="w-full flex flex-col items-center gap-6">
              <div className="text-center w-full">
                <h2 className="text-2xl font-semibold">分析完成</h2>
                <p className="text-gray-400">
                  从 {allArticles.length} 篇文章中筛选出 {filteredArticles.length} 篇 “志怪异事” 相关文章。
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-colors duration-200"
                    >
                      重新分析
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={filteredArticles.length === 0}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    下载结果 (CSV)
                </button>
                </div>
              </div>
              {filteredArticles.length > 0 ? (
                <ResultsTable articles={filteredArticles} />
              ) : (
                <p className="mt-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                  未找到符合条件的文章。
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
