import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, BookOpen, ChevronUp, List, X } from 'lucide-react';
import { storage } from '../lib/storage';
import { processArticleHtml } from '../lib/converter';
import DictionaryModal from './DictionaryModal';

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [processedHtml, setProcessedHtml] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [activeChapterId, setActiveChapterId] = useState('');
  const [showNav, setShowNav] = useState(true);
  
  const contentRef = useRef(null);
  const lastScrollY = useRef(0);
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const tocScrollRef = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(null);
  const [isSwipingDrawer, setIsSwipingDrawer] = useState(false);

  const handleTouchStart = (e) => {
    if (e.touches.length > 1) return; // Ignore multi-touch (e.g. pinch to zoom)
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    setIsSwipingDrawer(false);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 1) {
      setIsSwipingDrawer(false);
      setSwipeOffset(null);
      return;
    }
    if (!touchStart.current.x) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStart.current.x;
    const deltaY = currentY - touchStart.current.y;
    
    if (!isSwipingDrawer) {
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if ((!showToc && deltaX > 0) || (showToc && deltaX < 0)) {
          setIsSwipingDrawer(true);
        }
      }
    }

    if (isSwipingDrawer) {
      const drawerWidth = 320;
      let newOffset = !showToc ? -drawerWidth + deltaX : deltaX;
      newOffset = Math.max(-drawerWidth, Math.min(0, newOffset));
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current.x) return;
    
    if (isSwipingDrawer) {
      const currentX = e.changedTouches[0].clientX;
      const deltaX = currentX - touchStart.current.x;
      const velocity = deltaX / (Date.now() - touchStart.current.time);
      const drawerWidth = 320;

      if (!showToc && (deltaX > drawerWidth / 3 || velocity > 0.5)) {
        setShowToc(true);
      } else if (showToc && (deltaX < -drawerWidth / 3 || velocity < -0.5)) {
        setShowToc(false);
      }
    }
    
    setSwipeOffset(null);
    setIsSwipingDrawer(false);
    touchStart.current = { x: 0, y: 0, time: 0 };
  };

  const handleContentClick = () => {
    if (window.getSelection().toString().length > 0) return;
    setShowNav(!showNav);
    setShowSettings(false);
  };

  const hasJumped = useRef(false);

  useEffect(() => {
    hasJumped.current = false;
    loadArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowNav(false); // scrolling down
      } else {
        setShowNav(true); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isProcessing && contentRef.current) {
      const h3Elements = contentRef.current.querySelectorAll('h3');
      const extractedChapters = [];
      h3Elements.forEach((el, index) => {
        const id = `chapter-${index}`;
        if (!el.id) el.id = id;
        extractedChapters.push({ id: el.id, title: el.textContent });
      });
      setChapters(extractedChapters);
    }
  }, [processedHtml, isProcessing]);

  // Scroll Spy Effect
  useEffect(() => {
    if (chapters.length === 0) return;

    const handleScrollSpy = () => {
      let currentId = chapters[0]?.id;
      for (const chapter of chapters) {
        const el = document.getElementById(chapter.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the heading is above or just slightly below the top navbar (80px), it's active
          if (rect.top <= 120) {
            currentId = chapter.id;
          }
        }
      }
      setActiveChapterId(currentId);
    };

    handleScrollSpy();
    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [chapters]);

  // Save reading progress when active chapter changes
  useEffect(() => {
    if (hasJumped.current && activeChapterId && article && article.lastChapterId !== activeChapterId) {
      const updated = { ...article, lastChapterId: activeChapterId };
      setArticle(updated);
      storage.saveArticle(updated).catch(console.error);
    }
  }, [activeChapterId]);

  // Jump to last chapter when content is ready
  useEffect(() => {
    if (!isProcessing && chapters.length > 0 && !hasJumped.current) {
      if (article?.lastChapterId) {
        setTimeout(() => {
          const el = document.getElementById(article.lastChapterId);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'instant' });
          }
          hasJumped.current = true;
        }, 100);
      } else {
        hasJumped.current = true;
      }
    }
  }, [isProcessing, chapters, article]);

  // Auto-scroll TOC to active item when opened
  useEffect(() => {
    if (showToc && activeChapterId) {
      const activeEl = document.getElementById(`toc-${activeChapterId}`);
      if (activeEl && tocScrollRef.current) {
        const container = tocScrollRef.current;
        const scrollPos = activeEl.offsetTop - (container.offsetHeight / 2) + (activeEl.offsetHeight / 2);
        // Jump directly to the chapter without smooth scroll flash
        container.scrollTo({ top: scrollPos, behavior: 'instant' });
      }
    }
  }, [showToc]);

  const loadArticle = async () => {
    const data = await storage.getArticle(id);
    if (!data) {
      alert("文章不存在");
      navigate('/');
      return;
    }
    setArticle(data);
    applyTheme(data.theme || 'dark');
    processContent(data.rawHtml, data.replacements);
  };

  const processContent = async (rawHtml, replacements) => {
    setIsProcessing(true);
    // Use setTimeout to allow UI to update loading state before heavy processing
    setTimeout(() => {
      const html = processArticleHtml(rawHtml, replacements || [], true);
      setProcessedHtml(html);
      setIsProcessing(false);
    }, 50);
  };

  const handleSaveReplacements = async (newReplacements) => {
    const updatedArticle = { ...article, replacements: newReplacements };
    setArticle(updatedArticle);
    setShowDictionary(false);
    
    // Save to DB
    await storage.saveArticle(updatedArticle);
    
    // Reprocess content
    processContent(updatedArticle.rawHtml, newReplacements);
  };

  const updateSetting = async (key, value) => {
    const updatedArticle = { ...article, [key]: value };
    setArticle(updatedArticle);
    await storage.saveArticle(updatedArticle);
    
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const applyTheme = (theme) => {
    const htmlEl = document.documentElement;
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      htmlEl.style.backgroundColor = '#111827';
    } else {
      htmlEl.classList.remove('dark');
      htmlEl.style.backgroundColor = theme === 'paper' ? '#f4ecd8' : '#ffffff';
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!article) return <div className="min-h-screen flex items-center justify-center">載入中...</div>;

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        article.theme === 'paper' ? 'bg-[#f4ecd8] text-[#5c4b37]' : 
        article.theme === 'light' ? 'bg-white text-gray-900' : 
        'bg-gray-900 text-gray-100'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold truncate px-4 flex-1 text-center">{article.title}</h1>
          <div className="flex gap-1">
            <button onClick={() => setShowToc(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <List className="w-6 h-6" />
            </button>
            <button onClick={() => setShowDictionary(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <BookOpen className="w-6 h-6" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)}></div>
          <div className="fixed top-16 right-4 z-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 w-72 border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">字體大小</label>
            <div className="flex items-center gap-4">
              <button onClick={() => updateSetting('fontSize', Math.max(12, (article.fontSize || 18) - 2))} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg">A-</button>
              <span className="flex-1 text-center">{article.fontSize || 18}px</span>
              <button onClick={() => updateSetting('fontSize', Math.min(32, (article.fontSize || 18) + 2))} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg">A+</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">背景主題</label>
            <div className="flex gap-2">
              <button 
                onClick={() => updateSetting('theme', 'light')}
                className={`flex-1 py-2 rounded-lg border-2 ${article.theme === 'light' ? 'border-blue-500' : 'border-transparent'} bg-white text-gray-900 border shadow-sm`}
              >白</button>
              <button 
                onClick={() => updateSetting('theme', 'paper')}
                className={`flex-1 py-2 rounded-lg border-2 ${article.theme === 'paper' ? 'border-blue-500' : 'border-transparent'} bg-[#f4ecd8] text-[#5c4b37] shadow-sm`}
              >紙</button>
              <button 
                onClick={() => updateSetting('theme', 'dark')}
                className={`flex-1 py-2 rounded-lg border-2 ${article.theme === 'dark' ? 'border-blue-500' : 'border-transparent'} bg-gray-900 text-white border-gray-700 shadow-sm`}
              >黑</button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Article Content */}
      <div 
        className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-24 pb-32 reader-content relative"
        onClick={handleContentClick}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .reader-content .prose p, 
          .reader-content .prose span, 
          .reader-content .prose a {
            font-size: ${article.fontSize || 18}px !important;
            line-height: 1.8 !important;
          }
          .reader-content .prose h3 {
            font-size: ${(article.fontSize || 18) * 1.35}px !important;
          }
        `}} />
        
        {isProcessing && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center p-6 bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-700 dark:text-gray-200 font-bold">更新內容中...</p>
          </div>
        )}
        
        <div 
          ref={contentRef}
          className={`prose prose-lg dark:prose-invert max-w-none transition-opacity duration-300 ${isProcessing ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
          dangerouslySetInnerHTML={{ __html: processedHtml }} 
        />
      </div>

      {/* Scroll to top button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 ${showNav ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* Table of Contents Sidebar */}
      <div 
        className={`fixed inset-0 z-50 flex ${
          swipeOffset !== null ? '' : 'transition-colors duration-300'
        } ${
          (showToc || swipeOffset !== null) ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          backgroundColor: swipeOffset !== null
            ? `rgba(0,0,0, ${0.6 * (1 - Math.abs(swipeOffset) / 320)})`
            : showToc ? 'rgba(0,0,0,0.6)' : 'transparent'
        }}
      >
        <div 
          className={`w-80 max-w-[80%] bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transform ${
            swipeOffset !== null ? '' : 'transition-transform duration-300'
          }`}
          style={{
            transform: swipeOffset !== null 
              ? `translateX(${swipeOffset}px)` 
              : showToc ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-lg flex items-center gap-2"><List className="w-5 h-5"/>目錄</h3>
            <button onClick={() => setShowToc(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={tocScrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
            {chapters.length === 0 ? (
              <p className="text-gray-500 text-center py-10">找不到章節標題 (需有 h3 標籤)</p>
            ) : (
              chapters.map((chap) => (
                <button
                  key={chap.id}
                  id={`toc-${chap.id}`}
                  onClick={() => {
                    setShowToc(false);
                    const el = document.getElementById(chap.id);
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-lg transition-colors truncate border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                    activeChapterId === chap.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold'
                      : 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                  }`}
                >
                  {chap.title}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex-1" onClick={() => setShowToc(false)}></div>
      </div>

      {/* Modals */}
      <DictionaryModal 
        isOpen={showDictionary} 
        onClose={() => setShowDictionary(false)} 
        replacements={article.replacements || []}
        onSave={handleSaveReplacements}
      />
    </div>
  );
}
