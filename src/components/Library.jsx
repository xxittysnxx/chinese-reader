import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Upload, Trash2, Plus, X } from 'lucide-react';
import { storage } from '../lib/storage';
import { processArticleHtml } from '../lib/converter';

export default function Library() {
  const [articles, setArticles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const list = await storage.getArticlesList();
    setArticles(list);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('確定要刪除這篇文章嗎？')) {
      await storage.deleteArticle(id);
      loadArticles();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawHtml = event.target.result;
        
        // Extract title strictly from filename as requested
        const title = file.name.replace('.html', '');
        
        // Save raw un-processed article so replacements can be changed dynamically later
        const newArticle = {
          title,
          rawHtml,
          replacements: [], // Custom replacements array
          theme: 'dark', // Default theme as requested
          fontSize: 18
        };
        
        const newId = await storage.saveArticle(newArticle);
        setShowUploadModal(false);
        setIsUploading(false);
        navigate(`/read/${newId}`);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error uploading file", error);
      alert("上傳失敗");
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Book className="w-8 h-8 text-blue-500" />
          我的書庫
        </h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
        >
          <Upload className="w-5 h-5" />
          <span>上傳文章</span>
        </button>
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Book className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-2">書庫空空如也</h2>
          <p className="text-gray-500 mb-6">點擊上方按鈕上傳 HTML 文章開始閱讀</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <Link 
              key={article.id} 
              to={`/read/${article.id}`}
              className="block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 group relative"
            >
              <h2 className="text-xl font-bold mb-3 line-clamp-2 pr-8">{article.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">
                {article.snippet}...
              </p>
              <div className="mt-4 text-xs text-gray-400">
                更新於 {new Date(article.updatedAt).toLocaleDateString()}
              </div>
              <button 
                onClick={(e) => handleDelete(e, article.id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">上傳文章 (HTML)</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-400 rounded-xl p-10 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">點擊選擇檔案</p>
              <p className="text-sm text-gray-500 mt-2">支援 .html 格式</p>
            </div>
            
            <input 
              type="file" 
              accept=".html" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            {isUploading && (
              <div className="mt-4 text-center text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                處理中，這可能需要幾秒鐘的時間...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
