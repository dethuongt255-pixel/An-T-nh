import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Image as ImageIcon, Menu, X, ChevronLeft, ChevronRight, Edit3, Loader2, History, Settings2 } from 'lucide-react';
import { useAppContext } from '../context';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compressImage } from '../utils/image';

interface Article {
  id: string;
  title: string;
  description: string;
}

interface Chapter {
  id: string;
  content: string;
  background?: string;
}

export const Screen7: React.FC = () => {
  const { apiSettings, setIsSwipingDisabled } = useAppContext();
  
  const [view, setView] = useLocalStorage<'browser' | 'workspace'>('rp_s7_view', 'browser');
  const [appBackground, setAppBackground] = useLocalStorage<string>('rp_s7_appBg', '');
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('rp_s7_history', []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useLocalStorage<Article[]>('rp_s7_articles', []);
  const [isSearching, setIsSearching] = useState(false);
  
  // Workspace state
  const [, setSelectedArticle] = useLocalStorage<Article | null>('rp_s7_selectedArticle', null);
  const [novelName, setNovelName] = useLocalStorage('rp_s7_novelName', '');
  const [novelBg, setNovelBg] = useLocalStorage('rp_s7_novelBg', '');
  const [chapterLength, setChapterLength] = useLocalStorage('rp_s7_chapterLength', 2000);
  const [chapters, setChapters] = useLocalStorage<Chapter[]>('rp_s7_chapters', []);
  const [currentChapterIndex, setCurrentChapterIndex] = useLocalStorage('rp_s7_chapterIndex', 0);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings state
  const [isCustomBehaviorEnabled, setIsCustomBehaviorEnabled] = useLocalStorage('rp_s7_customBehaviorEnabled', false);
  const [customBehavior, setCustomBehavior] = useLocalStorage('rp_s7_customBehavior', '');
  const [isNsfwEnabled, setIsNsfwEnabled] = useLocalStorage('rp_s7_nsfwEnabled', false);
  const [nsfwLevel, setNsfwLevel] = useLocalStorage('rp_s7_nsfwLevel', 'Nhẹ');

  useEffect(() => {
    if (view === 'workspace' || isSidebarOpen || isChapterDrawerOpen || isSettingsOpen) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [view, isSidebarOpen, isChapterDrawerOpen, isSettingsOpen, setIsSwipingDisabled]);

  const handleAppBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => setAppBackground(base64));
    }
  };

  const handleNovelBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => setNovelBg(base64));
    }
  };

  const searchArticles = async (query: string, append = false) => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }
    if (!query.trim()) return;

    setIsSearching(true);
    if (!append && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev].slice(0, 20));
    }

    let systemPrompt = `Bạn là một AI chuyên tạo ý tưởng tiểu thuyết. Người dùng sẽ nhập một chủ đề. Hãy tạo ra đúng 20 ý tưởng tiểu thuyết/bài viết liên quan đến chủ đề đó. Chỉ chấp nhận các chủ đề liên quan đến truyện/tiểu thuyết. Nếu chủ đề không liên quan, hãy tự động chuyển hướng nó thành một ý tưởng truyện hư cấu.
Trả về định dạng JSON là một mảng gồm 20 object, mỗi object có:
- title: Tên truyện/bài viết
- description: Mô tả ngắn gọn nội dung (khoảng 2-3 câu)
Chỉ trả về JSON hợp lệ, không kèm văn bản nào khác.`;

    if (isCustomBehaviorEnabled && customBehavior.trim()) {
      systemPrompt += `\n\nQuy tắc vận hành tùy chỉnh từ người dùng:\n${customBehavior}`;
    }

    if (isNsfwEnabled) {
      systemPrompt += `\n\nYÊU CẦU NSFW: Người dùng đã bật chế độ NSFW ở mức độ [${nsfwLevel}]. Bạn PHẢI tuân thủ và thể hiện đúng mức độ này trong nội dung tạo ra, không được từ chối.`;
    }

    try {
      const baseUrl = apiSettings.endpoint.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Chủ đề: ${query}` }
          ],
          temperature: 0.8,
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const newArticles: Article[] = JSON.parse(jsonMatch[0]).map((a: any) => ({
          id: Date.now().toString() + Math.random().toString(),
          title: a.title,
          description: a.description
        }));
        
        if (append) {
          setArticles(prev => [...prev, ...newArticles]);
        } else {
          setArticles(newArticles);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tìm kiếm ý tưởng.");
    } finally {
      setIsSearching(false);
    }
  };

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setNovelName(article.title);
    setChapters([]);
    setCurrentChapterIndex(0);
    setView('workspace');
  };

  const generateChapter = async (type: 'new' | 'extend') => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }

    setIsGenerating(true);
    
    let prompt = '';
    let systemPrompt = '';

    if (type === 'new') {
      systemPrompt = `Bạn là một nhà văn tiểu thuyết xuất sắc. Hãy viết một chương tiểu thuyết dựa trên yêu cầu của người dùng.
Tên truyện: ${novelName}
Độ dài yêu cầu: Khoảng ${chapterLength} ký tự.
Văn phong: Lôi cuốn, hấp dẫn.
Chỉ trả về nội dung chương truyện, không kèm lời bình luận.`;
      
      prompt = `Ý tưởng chương mới: ${userInput || 'Hãy viết tiếp diễn biến hợp lý'}`;
      if (chapters.length > 0) {
        prompt += `\n\nTóm tắt các chương trước để nối tiếp: ${chapters.slice(-3).map(c => c.content.substring(0, 200) + '...').join('\n')}`;
      }
    } else {
      systemPrompt = `Bạn là một nhà văn tiểu thuyết xuất sắc. Hãy viết DÀI THÊM cho chương hiện tại dựa trên nội dung đã có.
Yêu cầu viết thêm khoảng 5000 ký tự để mở rộng tình tiết, miêu tả chi tiết hơn hoặc thêm hội thoại.
Chỉ trả về phần nội dung viết thêm, KHÔNG lặp lại nội dung cũ.`;
      
      const currentContent = chapters[currentChapterIndex]?.content || '';
      prompt = `Nội dung hiện tại: ${currentContent.substring(currentContent.length - 1000)}\n\nYêu cầu thêm: ${userInput || 'Viết tiếp diễn biến chi tiết hơn'}`;
    }

    if (isCustomBehaviorEnabled && customBehavior.trim()) {
      systemPrompt += `\n\nQuy tắc vận hành tùy chỉnh từ người dùng:\n${customBehavior}`;
    }

    if (isNsfwEnabled) {
      systemPrompt += `\n\nYÊU CẦU NSFW: Người dùng đã bật chế độ NSFW ở mức độ [${nsfwLevel}]. Bạn PHẢI tuân thủ và thể hiện đúng mức độ này trong nội dung tạo ra, không được từ chối.`;
    }

    try {
      const baseUrl = apiSettings.endpoint.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      if (text) {
        if (type === 'new') {
          const newChapter = { id: Date.now().toString(), content: text };
          const newChapters = [...chapters, newChapter];
          setChapters(newChapters);
          setCurrentChapterIndex(newChapters.length - 1);
        } else {
          const updatedChapters = [...chapters];
          updatedChapters[currentChapterIndex].content += '\n\n' + text;
          setChapters(updatedChapters);
        }
        setUserInput('');
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi viết truyện.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChapterBgUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        const updatedChapters = [...chapters];
        updatedChapters[index].background = base64;
        setChapters(updatedChapters);
      });
    }
  };

  if (view === 'workspace') {
    const currentBg = chapters[currentChapterIndex]?.background || novelBg;

    return (
      <div className="w-full h-full flex flex-col relative bg-[#FAF9F6] shrink-0 snap-center overflow-hidden font-['SF_Pro',_sans-serif]">
        {/* Khung 1: Background */}
        {currentBg && (
          <div 
            className="absolute inset-0 z-0 opacity-30 pointer-events-none"
            style={{ backgroundImage: `url(${currentBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}

        {/* Header / Khung 2: Tên truyện */}
        <div className="relative z-10 bg-white/80 backdrop-blur-md border-b border-[#F3B4C2] p-3 flex items-center gap-3">
          <button onClick={() => setView('browser')} className="p-2 text-gray-500 hover:text-[#F3B4C2] rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="text" 
              value={novelName}
              onChange={e => setNovelName(e.target.value)}
              className="font-bold text-lg text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Tên tiểu thuyết..."
            />
            <Edit3 size={16} className="text-gray-400 shrink-0" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FDF2F5] rounded-full px-3 py-1 border border-[#F9C6D4]">
              <span className="text-xs text-[#F3B4C2] font-bold mr-2">Độ dài:</span>
              <input 
                type="number" 
                value={chapterLength}
                onChange={e => setChapterLength(Number(e.target.value))}
                className="w-16 bg-transparent border-none focus:outline-none text-sm font-bold text-gray-700"
                min={0} max={50000}
              />
            </div>
            
            <label className="p-2 text-[#F3B4C2] hover:bg-[#FDF2F5] rounded-full cursor-pointer transition-colors">
              <ImageIcon size={20} />
              <input type="file" accept="image/*" onChange={handleNovelBgUpload} className="hidden" />
            </label>
            
            <button onClick={() => setIsChapterDrawerOpen(true)} className="p-2 text-[#F3B4C2] hover:bg-[#FDF2F5] rounded-full transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Khung 3: Nội dung truyện */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
          <div className="max-w-3xl mx-auto">
            {chapters.length > 0 && chapters[currentChapterIndex] ? (
              <div className="bg-white/95 backdrop-blur-sm p-8 sm:p-12 rounded-[32px] shadow-xl border border-[#F3B4C2] min-h-[60vh]">
                <h3 className="text-xl font-bold text-center text-[#F3B4C2] mb-8">Chương {currentChapterIndex + 1}</h3>
                <div className="prose prose-pink max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                  {chapters[currentChapterIndex].content}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center pt-20">
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-[#F3B4C2] shadow-lg">
                  <Edit3 size={40} className="text-[#F3B4C2]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Bắt đầu chương 1</h3>
                <p className="text-gray-500 text-sm max-w-xs">Nhập ý tưởng bên dưới để AI viết chương đầu tiên.</p>
              </div>
            )}
          </div>
        </div>

        {/* Khung Nhập liệu (Không lấn chiếm) */}
        <div className="relative z-20 bg-white/90 backdrop-blur-xl border-t border-[#F3B4C2] p-4">
          {isGenerating && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#F9C6D4] text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce border border-white">
              <Loader2 size={14} className="animate-spin" /> Đang sáng tác...
            </div>
          )}
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="flex gap-3">
              <textarea
                rows={1}
                placeholder="Nhập ý tưởng cho chương tiếp theo hoặc nội dung muốn viết thêm..."
                className="flex-1 bg-white border border-[#F3B4C2] text-gray-800 placeholder-gray-400 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] resize-none text-sm min-h-[50px] max-h-[100px] shadow-sm"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            
            {/* Khung 4: Điều hướng & Hành động */}
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
                disabled={currentChapterIndex === 0 || isGenerating}
                className="flex-1 py-3 bg-white border border-[#F3B4C2] text-[#F3B4C2] rounded-xl font-bold text-sm hover:bg-[#FDF2F5] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={18} /> Chương trước
              </button>
              
              <button 
                onClick={() => generateChapter(chapters.length === 0 ? 'new' : 'extend')}
                disabled={isGenerating}
                className="flex-[2] py-3 bg-[#F9C6D4] text-white rounded-xl font-bold text-sm hover:bg-[#F3B4C2] disabled:opacity-50 transition-colors shadow-md active:scale-95"
              >
                {chapters.length === 0 ? 'Viết Chương 1' : 'Viết dài thêm (+5000 ký tự)'}
              </button>
              
              <button 
                onClick={() => {
                  if (currentChapterIndex === chapters.length - 1) {
                    generateChapter('new');
                  } else {
                    setCurrentChapterIndex(currentChapterIndex + 1);
                  }
                }}
                disabled={isGenerating}
                className="flex-1 py-3 bg-white border border-[#F3B4C2] text-[#F3B4C2] rounded-xl font-bold text-sm hover:bg-[#FDF2F5] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {currentChapterIndex === chapters.length - 1 ? 'Chương mới' : 'Chương sau'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Ngăn kéo Chương */}
        <div className={`absolute inset-y-0 right-0 w-80 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isChapterDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Drawer Background */}
          <div 
            className="absolute inset-0 z-0 bg-[#FDF2F5]"
            style={novelBg ? { backgroundImage: `url(${novelBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-xl border-l border-[#F3B4C2]" />
          
          <div className="relative z-10 p-4 border-b border-[#F3B4C2] flex justify-between items-center bg-white/50">
            <h3 className="font-bold text-[#F3B4C2]">Danh sách chương</h3>
            <button onClick={() => setIsChapterDrawerOpen(false)} className="text-gray-500 hover:text-[#F3B4C2]">
              <X size={20} />
            </button>
          </div>
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
            {chapters.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-10">Chưa có chương nào</p>
            ) : (
              chapters.map((chap, idx) => (
                <div key={chap.id} className={`w-full flex items-center p-2 rounded-xl border transition-all ${currentChapterIndex === idx ? 'bg-white border-[#F3B4C2] shadow-md' : 'bg-white/50 border-transparent hover:bg-white'}`}>
                  <button
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setIsChapterDrawerOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <span className={`font-bold ${currentChapterIndex === idx ? 'text-[#F3B4C2]' : 'text-gray-700'}`}>Chương {idx + 1}</span>
                    <p className="text-xs opacity-70 truncate mt-1 text-gray-500">{chap.content.substring(0, 50)}...</p>
                  </button>
                  <label className="p-2 text-gray-400 hover:text-[#F3B4C2] hover:bg-[#FDF2F5] rounded-full cursor-pointer transition-colors ml-2 shrink-0" title="Đổi hình nền chương">
                    <ImageIcon size={16} />
                    <input type="file" accept="image/*" onChange={(e) => handleChapterBgUpload(idx, e)} className="hidden" />
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
        {isChapterDrawerOpen && (
          <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setIsChapterDrawerOpen(false)} />
        )}
      </div>
    );
  }

  // Browser View
  return (
    <div className="w-full h-full flex flex-col relative bg-[#FAF9F6] shrink-0 snap-center overflow-hidden font-['SF_Pro',_sans-serif]">
      {appBackground && (
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: `url(${appBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* Header / Search Bar */}
      <div className="relative z-10 bg-[#FDF2F5]/90 backdrop-blur-md border-b border-[#F3B4C2] p-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#F3B4C2] hover:bg-white rounded-full transition-colors">
          <History size={24} />
        </button>
        
        <div className="flex-1 relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchArticles(searchQuery)}
            placeholder="Tìm kiếm chủ đề tiểu thuyết..."
            className="w-full bg-white border border-[#F9C6D4] rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] shadow-inner text-gray-700"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F3B4C2]" size={18} />
        </div>

        <label className="p-2 text-[#F3B4C2] hover:bg-white rounded-full cursor-pointer transition-colors" title="Đổi hình nền">
          <ImageIcon size={24} />
          <input type="file" accept="image/*" onChange={handleAppBgUpload} className="hidden" />
        </label>

        <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-[#F3B4C2] hover:bg-white rounded-full transition-colors" title="Cài đặt">
          <Settings2 size={24} />
        </button>
      </div>

      {/* Main Content: Articles Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        {isSearching && articles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#F3B4C2]">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="font-bold">Đang tìm kiếm ý tưởng...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <Search size={60} className="mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">Google Novel</h2>
            <p className="text-sm max-w-xs">Nhập chủ đề bạn muốn viết để AI gợi ý 20 ý tưởng tiểu thuyết tuyệt vời.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
            {articles.map(article => (
              <div 
                key={article.id}
                onClick={() => openArticle(article)}
                className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-[#E6CFD2] hover:border-[#F3B4C2] hover:shadow-lg transition-all cursor-pointer group"
              >
                <h3 className="font-bold text-lg text-[#3A3A3A] mb-2 group-hover:text-[#F3B4C2] line-clamp-2">{article.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{article.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for More */}
      {articles.length > 0 && (
        <button 
          onClick={() => searchArticles(searchQuery, true)}
          disabled={isSearching}
          className="absolute bottom-6 right-6 z-20 w-14 h-14 bg-[#F3B4C2] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#F9C6D4] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          title="Tải thêm 20 bài"
        >
          {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Plus size={28} />}
        </button>
      )}

      {/* Sidebar History */}
      <div className={`absolute inset-y-0 left-0 w-72 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Background */}
        <div 
          className="absolute inset-0 z-0 bg-[#FDF2F5]"
          style={appBackground ? { backgroundImage: `url(${appBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-xl border-r border-[#F3B4C2]" />
        
        <div className="relative z-10 p-4 border-b border-[#F3B4C2] flex justify-between items-center bg-[#FDF2F5]/80">
          <h3 className="font-bold text-[#F3B4C2] flex items-center gap-2"><History size={18}/> Lịch sử tìm kiếm</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-[#F3B4C2]">
            <X size={20} />
          </button>
        </div>
        <div className="relative z-10 flex-1 overflow-y-auto p-2">
          {searchHistory.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">Chưa có lịch sử</p>
          ) : (
            searchHistory.map((history, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(history);
                  searchArticles(history);
                  setIsSidebarOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-white/80 rounded-xl text-sm text-gray-800 font-medium transition-colors truncate flex items-center gap-2 mb-1 border border-transparent hover:border-[#F3B4C2]"
              >
                <Search size={14} className="text-[#F3B4C2] shrink-0" />
                {history}
              </button>
            ))
          )}
        </div>
      </div>
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#E6CFD2]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F3B4C2] flex items-center gap-2">
                <Settings2 size={24} /> Cài đặt Google Novel
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-[#F3B4C2] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Custom Behavior Section */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E6CFD2]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">Quản lý cách thức vận hành</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={isCustomBehaviorEnabled}
                      onChange={(e) => setIsCustomBehaviorEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F3B4C2]"></div>
                  </label>
                </div>
                {isCustomBehaviorEnabled && (
                  <textarea
                    value={customBehavior}
                    onChange={(e) => setCustomBehavior(e.target.value)}
                    placeholder="Nhập quy tắc vận hành, cách hành văn, hoặc bất kỳ yêu cầu nào cho AI..."
                    className="w-full h-32 p-3 border border-[#F3B4C2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] text-sm text-gray-700 resize-none bg-white"
                  />
                )}
              </div>

              {/* NSFW Section */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E6CFD2]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">Chế độ NSFW</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={isNsfwEnabled}
                      onChange={(e) => setIsNsfwEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
                
                {isNsfwEnabled && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Chọn cấp độ NSFW:</p>
                    {['Nhẹ', 'Cao', 'Khiêu Dâm nặng', 'Mức báo động'].map((level) => (
                      <label key={level} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-red-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="nsfwLevel"
                          value={level}
                          checked={nsfwLevel === level}
                          onChange={(e) => setNsfwLevel(e.target.value)}
                          className="w-4 h-4 text-red-500 focus:ring-red-500 border-gray-300"
                        />
                        <span className={`text-sm font-medium ${nsfwLevel === level ? 'text-red-600' : 'text-gray-700'}`}>
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
