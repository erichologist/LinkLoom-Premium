/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { Settings2, Link as LinkIcon, Trash2, Copy, AlertCircle, Plus, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { LinkPreview, AppSettings } from './types';

export default function App() {
  const [urlsInput, setUrlsInput] = useState('');
  const [previews, setPreviews] = useState<LinkPreview[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    format: 'markdown',
    imageSize: 'md',
    showDescription: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('linkloom_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('linkloom_settings', JSON.stringify(settings));
  }, [settings]);

  // Extract URLs and fetch metadata
  const handleGenerate = async () => {
    if (!urlsInput.trim()) return;

    // Basic URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = urlsInput.match(urlRegex) || [];
    
    // Create new entries
    const newEntries: LinkPreview[] = foundUrls.map((url) => ({
      id: Math.random().toString(36).substring(7),
      url,
      title: null,
      description: null,
      image: null,
      favicon: null,
      loading: true,
    }));

    if (newEntries.length === 0) return;

    setPreviews((prev) => [...prev, ...newEntries]);
    setUrlsInput('');

    // Fetch data for each
    for (const entry of newEntries) {
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(entry.url)}`);
        const data = await res.json();
        
        if (data.status === 'success') {
          setPreviews((prev) => prev.map((p) => 
            p.id === entry.id ? {
              ...p,
              title: data.data.title || entry.url,
              description: data.data.description,
              image: data.data.image?.url || null,
              favicon: data.data.logo?.url || null,
              loading: false,
            } : p
          ));
        } else {
          setPreviews((prev) => prev.map((p) => p.id === entry.id ? { ...p, loading: false, error: true } : p));
        }
      } catch (error) {
        setPreviews((prev) => prev.map((p) => p.id === entry.id ? { ...p, loading: false, error: true } : p));
      }
    }
  };

  const removePreview = (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const generateExportCode = () => {
    return previews.map((p) => {
      if (settings.format === 'markdown') {
        const img = p.image ? `![${p.title}](${p.image})` : '';
        return `[${img}\n${p.title}](${p.url})`;
      } else {
        const img = p.image ? `<img src="${p.image}" alt="${p.title}" />` : '';
        return `<a href="${p.url}">\n  ${img}\n  <span>${p.title}</span>\n</a>`;
      }
    }).join('\n\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateExportCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050507]">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#22d3ee]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-[#a855f7]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 immersive-glass border-t-0 border-x-0 !border-b-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-r from-[#22d3ee] to-[#a855f7] p-[1px]">
              <div className="w-full h-full bg-[#050507] rounded-[7px] flex items-center justify-center">
                <LinkIcon size={16} className="text-[#22d3ee]" />
              </div>
            </div>
            <span className="font-bold tracking-[1px] text-[#f8fafc] font-sans">
              LINK<span className="immersive-accent-text">LOOM</span>
            </span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Side: Input area */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="immersive-glass rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-[11px] uppercase tracking-[1px] opacity-50 mb-4 block">Batch URL Input</h2>
            
            <div className="relative">
              <textarea
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                placeholder="https://example.com&#10;https://github.com..."
                className="w-full h-48 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-[13px] text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#22d3ee] transition-all resize-none placeholder-[rgba(255,255,255,0.3)] font-mono"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={!urlsInput.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 immersive-btn-primary immersive-neon-border py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus size={18} />
              Generate Previews
            </button>
          </motion.div>

          {/* Export Panel (only visible if we have previews) */}
          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="immersive-glass rounded-2xl p-6 shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] uppercase tracking-[1px] opacity-50 block">Export Selection</h2>
                  <span className="immersive-pill text-[10px] rounded-full px-2 py-0.5">
                    {previews.length} Item{previews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSettings(s => ({ ...s, format: 'html' }))}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${settings.format === 'html' ? 'immersive-pill' : 'text-white/50 hover:bg-white/5 border border-transparent'}`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, format: 'markdown' }))}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${settings.format === 'markdown' ? 'immersive-pill' : 'text-white/50 hover:bg-white/5 border border-transparent'}`}
                  >
                    Markdown
                  </button>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#f8fafc] font-medium py-3 rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-all font-sans cursor-pointer"
                >
                  {copied ? <Check size={18} className="text-[#22d3ee]" /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy Code Snippet'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Gallery */}
        <div className="lg:col-span-8 flex flex-col">
          {previews.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center h-64 lg:h-auto">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
                <ImageIcon size={32} />
              </div>
              <h3 className="text-white font-medium mb-2">No Generation Yet</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Paste your links on the left to start generating beautiful preview cards that you can customize and reorder.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] uppercase tracking-[1px] opacity-50 block">Interactive Gallery</h2>
                <button 
                  onClick={() => setPreviews([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1.5 rounded-full uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              </div>
              
              <Reorder.Group 
                values={previews} 
                onReorder={setPreviews} 
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20"
                axis="y"
              >
                <AnimatePresence>
                  {previews.map((preview) => (
                    <Reorder.Item
                      key={preview.id}
                      value={preview}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      // Need to add this class for grid compatibility with framer-motion Reorder sometimes,
                      // but typically Reorder expects list styling, we can force relative to work.
                      className="relative w-full h-full cursor-grab active:cursor-grabbing outline-none group"
                    >
                      <div className="group/card relative immersive-glass rounded-[16px] overflow-hidden hover:immersive-neon-border transition-all h-full flex flex-col">
                        
                        {/* Remove Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button
                            onPointerDownCapture={(e) => {
                              // Prevent drag when clicking remove
                              e.stopPropagation();
                              removePreview(preview.id);
                            }}
                            className="bg-red-500/80 backdrop-blur text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Image Skeleton / Loading */}
                        <div className={`relative w-full bg-[#1e293b] flex-shrink-0 flex items-center justify-center ${
                          settings.imageSize === 'sm' ? 'aspect-[16/7]' : 
                          settings.imageSize === 'lg' ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[16/9]'
                        }`}>
                          {preview.loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[#22d3ee]">
                              <Loader2 className="animate-spin" size={24} />
                            </div>
                          ) : preview.error || !preview.image ? (
                            <div className="w-full h-full flex items-center justify-center text-white/20 flex-col gap-2">
                              {preview.error ? <AlertCircle size={24} /> : <ImageIcon size={24} />}
                            </div>
                          ) : (
                            <img 
                              src={preview.image} 
                              alt={preview.title || 'Preview'} 
                              className="w-full h-full object-cover select-none pointer-events-none"
                              draggable={false}
                            />
                          )}
                          
                          {/* Inner gradient overlay for text readability if needed */}
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-[rgba(0,0,0,0.5)] to-transparent pointer-events-none" />
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col items-start gap-1 pointer-events-none">
                          <div className="flex items-center gap-2.5 mb-0.5 w-full">
                            {preview.favicon ? (
                                <img src={preview.favicon} className="w-5 h-5 rounded-[4px] bg-[#22d3ee] p-0.5" alt="Favicon" />
                            ) : (
                                <div className="w-5 h-5 rounded-[4px] bg-[#22d3ee] flex-shrink-0" />
                            )}
                            <div className="text-[12px] font-semibold text-[#f8fafc] truncate w-full tracking-wide">
                              {preview.title || new URL(preview.url).hostname.replace('www.', '')}
                            </div>
                          </div>
                          
                          {settings.showDescription && preview.description && (
                            <p className="text-[#f8fafc] opacity-60 text-[10px] line-clamp-1 w-full pl-[30px]">
                              {preview.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </div>
          )}
        </div>
      </main>

      {/* Settings Bottom Sheet */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 immersive-glass immersive-neon-border border-b-0 rounded-t-[24px] shadow-[0_-10px_40px_rgba(34,211,238,0.1)] overflow-hidden bg-[#050507]/90"
            >
              <div className="max-w-xl mx-auto">
                {/* Drag handle visual */}
                <div className="w-full flex justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
                
                <div className="p-6 pt-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] uppercase tracking-[2px] opacity-60">Thumbnail Customizer</h3>
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="immersive-accent-text text-sm font-medium uppercase tracking-wider cursor-pointer"
                    >
                      Done
                    </button>
                  </div>

                  <div className="space-y-6 pb-2">
                    {/* Thumbnail Size */}
                    <div className="space-y-3">
                      <label className="text-[12px] opacity-80 flex items-center justify-between">
                        Banner Size
                        <span className="immersive-pill text-[10px] rounded-full px-2 py-0.5 border-none">
                          {settings.imageSize.toUpperCase()}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['sm', 'md', 'lg'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setSettings(s => ({ ...s, imageSize: size as any }))}
                            className={`py-2 rounded-[8px] text-[12px] transition-all font-semibold cursor-pointer ${
                              settings.imageSize === size 
                              ? 'immersive-btn-primary immersive-neon-border' 
                              : 'bg-[rgba(255,255,255,0.05)] text-white/50 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]'
                            }`}
                          >
                            {size === 'sm' ? 'Compact' : size === 'md' ? 'Standard' : 'Hero'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Metadata Toggle */}
                    <div className="flex items-center justify-between py-1">
                      <div className="space-y-0.5">
                        <label className="text-[12px] opacity-80 block">Show Description</label>
                        <p className="text-[10px] text-white/40">Include meta description below title</p>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, showDescription: !s.showDescription }))}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${settings.showDescription ? 'bg-[#22d3ee]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                      >
                        <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-[#050507] transition-transform ${settings.showDescription ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

