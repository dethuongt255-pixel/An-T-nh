import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Camera, ChevronRight, ChevronLeft, BookOpen, Send, Loader2, Settings2, Trash2, Menu, History, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context';
import { Novel, NovelCategory, NovelPrompt } from '../types';
import { compressImage } from '../utils/image';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { safeApiCall } from '../utils/api';

const PREDEFINED_CATEGORIES = [
  'Dễ thương', 'U buồn', 'Lãng mạn ngọt ngào', 'Trường học, Thanh Xuân Vườn Trường',
  'Hiện đại / Công sở', 'Cổ trang Trung Quốc', 'Việt Nam / hiện đại', 'Việt Nam thời phong kiến', 'Quốc tịch'
];

const WRITING_STYLES = [
  'Lãng mạn cổ điển', 'Hiện đại súc tích', 'Hài hước châm biếm', 'Miêu tả nội tâm sâu sắc',
  'Hành động kịch tính', 'Trinh thám bí ẩn', 'Huyền ảo kỳ bí', 'Khoa học viễn tưởng',
  'Kinh dị ám ảnh', 'Tự sự nhẹ nhàng', 'Hùng tráng sử thi', 'Đời thường mộc mạc',
  'Triết lý suy ngẫm', 'Thơ mộng bay bổng', 'Kịch tính dồn dập', 'Chậm rãi chi tiết',
  'Góc nhìn thứ nhất chân thực', 'Góc nhìn toàn tri khách quan', 'Phá vỡ bức tường thứ tư',
  'Phong cách Light Novel Nhật Bản'
];

export const Screen5: React.FC = () => {
  const { themeColor, novels, addNovel, updateNovel, deleteNovel, apiSettings, setIsSwipingDisabled } = useAppContext();
  const [view, setView] = useLocalStorage<'list' | 'create' | 'workspace'>('rp_s5_view', 'list');
  const [currentNovelId, setCurrentNovelId] = useLocalStorage<string | null>('rp_s5_currentNovelId', null);

  useEffect(() => {
    if (view === 'create' || view === 'workspace') {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    // Cleanup on unmount
    return () => setIsSwipingDisabled(false);
  }, [view, setIsSwipingDisabled]);

  // --- Create Novel State ---
  const [createStep, setCreateStep] = useLocalStorage('rp_s5_createStep', 1);
  const [newNovel, setNewNovel] = useLocalStorage<Partial<Novel>>('rp_s5_newNovel', () => ({
    title: '',
    cover: '',
    background: '',
    categories: PREDEFINED_CATEGORIES.map(name => ({ id: Date.now().toString() + Math.random(), name, tags: [] })),
    chapterLength: 1000,
    writingStyle: WRITING_STYLES[0],
    customStyle: '',
    prompts: [],
    char1: { name: '', info: '' },
    char2: { name: '', info: '' },
    plot: '',
    content: '',
    chapters: [],
    memoryLimit: 10
  }));

  const [tagInput, setTagInput] = useLocalStorage<{ [categoryId: string]: string }>('rp_s5_tagInput', {});
  const [newCategoryName, setNewCategoryName] = useLocalStorage('rp_s5_newCategoryName', '');
  
  const [promptInput, setPromptInput] = useLocalStorage('rp_s5_promptInput', { content: '', depth: 1 });

  // --- Workspace State ---
  const [userInput, setUserInput] = useLocalStorage('rp_s5_userInput', '');
  const [isGenerating, setIsGenerating] = useState(false);
  const contentEndRef = useRef<HTMLDivElement>(null);

  const currentNovel = novels.find(n => n.id === currentNovelId);

  useEffect(() => {
    if (view === 'workspace') {
      contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentNovel?.content, view]);

  const [isGeneratingNovelProfile, setIsGeneratingNovelProfile] = useState(false);

  const handleGenerateNovelProfile = async () => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }

    const prompt = window.prompt("Nhập ý tưởng cho tiểu thuyết (VD: Một câu chuyện tình yêu xuyên không, Một vụ án mạng bí ẩn):");
    if (!prompt) return;

    setIsGeneratingNovelProfile(true);
    
    const systemPrompt = `Bạn là một biên tập viên tiểu thuyết chuyên nghiệp.
Dựa trên ý tưởng của người dùng, hãy tạo một hồ sơ tiểu thuyết chi tiết.
Trả về kết quả dưới định dạng JSON với các trường sau:
- title: Tên tiểu thuyết
- writingStyle: Phong cách viết (chọn 1 trong danh sách: ${WRITING_STYLES.join(', ')})
- char1Name: Tên nhân vật chính 1
- char1Info: Thông tin nhân vật chính 1
- char2Name: Tên nhân vật chính 2
- char2Info: Thông tin nhân vật chính 2
- plot: Cốt truyện chi tiết

Yêu cầu:
- Ngôn ngữ: Tiếng Việt.
- Văn phong: Lôi cuốn, chuyên nghiệp.
- JSON phải hợp lệ.`;

    try {
      const generatedText = await safeApiCall({
        endpoint: apiSettings.endpoint,
        apiKey: apiSettings.apiKey,
        model: apiSettings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      });

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const profile = JSON.parse(jsonMatch[0]);
        setNewNovel(prev => ({
          ...prev,
          title: profile.title || prev.title,
          writingStyle: profile.writingStyle || prev.writingStyle,
          char1: { name: profile.char1Name || prev.char1?.name || '', info: profile.char1Info || prev.char1?.info || '' },
          char2: { name: profile.char2Name || prev.char2?.name || '', info: profile.char2Info || prev.char2?.info || '' },
          plot: profile.plot || prev.plot,
          cover: prev.cover || `https://picsum.photos/seed/${profile.title || 'novel'}/500/800`,
        }));
        setCreateStep(3); // Jump to step 3 to review
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo hồ sơ tiểu thuyết bằng AI.");
    } finally {
      setIsGeneratingNovelProfile(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setNewNovel(prev => ({ ...prev, [field]: base64 }));
      });
    }
  };

  const handleChapterBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>, chapterId: string) => {
    const file = e.target.files?.[0];
    if (file && currentNovel) {
      compressImage(file, (base64) => {
        const updatedChapters = (currentNovel.chapters || []).map(c => 
          c.id === chapterId ? { ...c, background: base64 } : c
        );
        updateNovel(currentNovel.id, { chapters: updatedChapters });
      });
    }
  };

  const handleAddTag = (categoryId: string) => {
    const tag = tagInput[categoryId]?.trim();
    if (!tag) return;
    
    setNewNovel(prev => ({
      ...prev,
      categories: prev.categories?.map(c => 
        c.id === categoryId ? { ...c, tags: [...c.tags, tag] } : c
      )
    }));
    setTagInput(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveTag = (categoryId: string, tagToRemove: string) => {
    setNewNovel(prev => ({
      ...prev,
      categories: prev.categories?.map(c => 
        c.id === categoryId ? { ...c, tags: c.tags.filter(t => t !== tagToRemove) } : c
      )
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setNewNovel(prev => ({
      ...prev,
      categories: [...(prev.categories || []), { id: Date.now().toString(), name: newCategoryName.trim(), tags: [] }]
    }));
    setNewCategoryName('');
  };

  const handleAddPrompt = () => {
    if (!promptInput.content.trim()) return;
    setNewNovel(prev => ({
      ...prev,
      prompts: [...(prev.prompts || []), { id: Date.now().toString(), ...promptInput }]
    }));
    setPromptInput({ content: '', depth: 1 });
  };

  const handleCreateNovel = () => {
    const novel: Novel = {
      id: Date.now().toString(),
      title: newNovel.title || 'Tiểu thuyết chưa đặt tên',
      cover: newNovel.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=500&auto=format&fit=crop',
      background: newNovel.background || '#FAF9F6',
      categories: newNovel.categories || [],
      chapterLength: newNovel.chapterLength !== undefined ? newNovel.chapterLength : 1000,
      writingStyle: newNovel.writingStyle || WRITING_STYLES[0],
      customStyle: newNovel.customStyle || '',
      prompts: newNovel.prompts || [],
      char1: newNovel.char1 || { name: '', info: '' },
      char2: newNovel.char2 || { name: '', info: '' },
      plot: newNovel.plot || '',
      content: '',
      chapters: [],
      memoryLimit: newNovel.memoryLimit || 10
    };
    addNovel(novel);
    setView('list');
    setCreateStep(1);
    // Reset state
    setNewNovel({
      title: '', cover: '', background: '',
      categories: PREDEFINED_CATEGORIES.map(name => ({ id: Date.now().toString() + Math.random(), name, tags: [] })),
      chapterLength: 1000, writingStyle: WRITING_STYLES[0], customStyle: '', prompts: [],
      char1: { name: '', info: '' }, char2: { name: '', info: '' }, plot: '', content: '',
      chapters: [], memoryLimit: 10
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useLocalStorage('rp_s5_fontSize', 18);

  const generateStory = async () => {
    if (!userInput.trim() || !currentNovel || isGenerating) return;
    
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt trước khi sử dụng.");
      return;
    }

    setIsGenerating(true);
    
    // Build system prompt based on novel settings
    const selectedTags = currentNovel.categories.flatMap(c => c.tags.map(t => `${c.name}: ${t}`)).join(', ');
    const promptsText = currentNovel.prompts.map(p => `[Depth ${p.depth}]: ${p.content}`).join('\n');
    
    const systemPrompt = `Bạn là một AI viết tiểu thuyết chuyên nghiệp.
Hãy viết tiếp câu chuyện dựa trên các thiết lập sau:
- Thể loại/Tags: ${selectedTags}
- Phong cách viết: ${currentNovel.writingStyle}
- Phong cách tùy chỉnh: ${currentNovel.customStyle}
- Độ dài yêu cầu mỗi lần viết: ${currentNovel.chapterLength > 0 ? `Khoảng ${currentNovel.chapterLength} ký tự. BẮT BUỘC TUÂN THỦ ĐỘ DÀI NÀY.` : 'Không giới hạn độ dài, hãy viết chi tiết và đầy đủ nhất có thể theo ý tưởng của người dùng.'}
- Nhân vật 1: ${currentNovel.char1.name} - ${currentNovel.char1.info}
- Nhân vật 2: ${currentNovel.char2.name} - ${currentNovel.char2.info}
- Cốt truyện (Plot): ${currentNovel.plot}
- Prompts/Presets bổ sung:
${promptsText}

HƯỚNG DẪN QUAN TRỌNG:
Người dùng sẽ đưa ra ý tưởng hoặc chỉ đạo cho đoạn tiếp theo.
BẠN KHÔNG ĐƯỢC PHÉP lặp lại chỉ đạo của người dùng trong văn bản tiểu thuyết.
CHỈ in ra nội dung tiểu thuyết, không kèm theo lời chào, lời giải thích hay bất kỳ văn bản nào khác ngoài câu chuyện.`;

    // Use memory limit to truncate history
    const historyChapters = (currentNovel.chapters || []).slice(-(currentNovel.memoryLimit || 10));
    const historyText = historyChapters.map(c => `[${c.title}]:\n${c.content}`).join('\n\n');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Lịch sử các chương trước (tối đa ${currentNovel.memoryLimit} chương):\n${historyText}\n\nNội dung nháp hiện tại:\n${currentNovel.content}\n\nÝ tưởng cho đoạn tiếp theo: ${userInput}` }
    ];

    try {
      const generatedText = await safeApiCall({
        endpoint: apiSettings.endpoint,
        apiKey: apiSettings.apiKey,
        model: apiSettings.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: currentNovel.chapterLength > 0 ? Math.max(4000, Math.ceil(currentNovel.chapterLength / 2)) : 8192,
      });

      if (generatedText) {
        const chapterNumber = (currentNovel.chapters || []).length + 1;
        const newChapter = {
          id: Date.now().toString(),
          title: `Chương ${chapterNumber}`,
          content: generatedText,
          createdAt: new Date().toISOString()
        };
        
        const updatedChapters = [...(currentNovel.chapters || []), newChapter];
        updateNovel(currentNovel.id, { 
          chapters: updatedChapters,
          content: generatedText 
        });
        setSelectedChapterId(newChapter.id);
        setUserInput('');
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi gọi API. Vui lòng kiểm tra lại cấu hình Proxy.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="w-full h-full relative overflow-y-auto shrink-0 snap-center pb-24 bg-[#FAF9F6]">
        <div className="pt-12 px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Tiểu thuyết</h2>
            <button 
              onClick={() => setView('create')}
              className="w-6 h-6 rounded-full bg-[#F9C6D4] text-white flex items-center justify-center shadow-md hover:bg-[#F3B4C2] transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

            <div className="grid grid-cols-2 gap-4">
              {novels.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-12 bg-white rounded-2xl border border-dashed border-[#F9C6D4]">
                  Chưa có tiểu thuyết nào. Hãy tạo mới!
                </div>
              ) : (
                novels.map(novel => (
                  <div 
                    key={novel.id} 
                    onClick={() => { setCurrentNovelId(novel.id); setView('workspace'); }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E6CFD2] cursor-pointer hover:shadow-md transition-shadow group relative"
                  >
                    <div className="h-40 relative">
                      <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNovel(novel.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-800 line-clamp-1">{novel.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{novel.writingStyle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER CREATE VIEW ---
  if (view === 'create') {
    return (
      <div className="w-full h-full relative overflow-y-auto shrink-0 snap-center pb-24 bg-[#FAF9F6]">
        <div className="sticky top-0 z-10 bg-[#FAF9F6]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#E6CFD2]">
          <button onClick={() => setView('list')} className="text-gray-600 hover:text-gray-900">
            <X size={24} />
          </button>
          <div className="text-sm font-bold text-[#F3B4C2]">Bước {createStep}/3</div>
          <div className="w-6"></div>
        </div>

        <div className="px-6 py-6">
          {createStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Thể loại & Hạng mục</h2>
                <button 
                  onClick={handleGenerateNovelProfile}
                  disabled={isGeneratingNovelProfile}
                  className="text-xs text-[#F3B4C2] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {isGeneratingNovelProfile ? "Đang tạo..." : "✨ Lên ý tưởng bằng AI"}
                </button>
              </div>
              <p className="text-sm text-gray-600">Nhập vô số chủ đề bạn muốn cho từng hạng mục.</p>
              
              <div className="space-y-6">
                {newNovel.categories?.map(category => (
                  <div key={category.id} className="bg-white p-4 rounded-2xl border border-[#E6CFD2] shadow-sm">
                    <h3 className="font-bold text-[#F3B4C2] mb-3">{category.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-[#F9C6D4] text-white text-xs font-medium rounded-full flex items-center gap-1">
                          {tag}
                          <button onClick={() => handleRemoveTag(category.id, tag)} className="hover:text-pink-200"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Thêm chủ đề..." 
                        className="flex-1 p-2 bg-[#FAF9F6] rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm"
                        value={tagInput[category.id] || ''}
                        onChange={e => setTagInput(prev => ({ ...prev, [category.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddTag(category.id)}
                      />
                      <button 
                        onClick={() => handleAddTag(category.id)}
                        className="px-4 py-2 bg-[#F9C6D4] text-white rounded-xl hover:bg-[#F3B4C2] transition-colors text-sm font-medium"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-white p-4 rounded-2xl border border-dashed border-[#F3B4C2]">
                  <h3 className="font-bold text-gray-700 mb-2">Thêm hạng mục mới</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tên hạng mục..." 
                      className="flex-1 p-2 bg-[#FAF9F6] rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium"
                    >
                      Tạo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-800">Phong cách viết</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Độ dài mỗi chương (Ký tự)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2]"
                    value={newNovel.chapterLength === 0 ? '' : newNovel.chapterLength}
                    onChange={e => {
                      const val = e.target.value;
                      setNewNovel(prev => ({ ...prev, chapterLength: val === '' ? 0 : Math.max(0, parseInt(val)) }));
                    }}
                    placeholder="Nhập số ký tự (VD: 1000, 0 = Không giới hạn)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ghi nhớ bộ nhớ (Số chương AI ghi nhớ)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2]"
                    value={newNovel.memoryLimit === 0 ? '' : newNovel.memoryLimit}
                    onChange={e => {
                      const val = e.target.value;
                      setNewNovel(prev => ({ ...prev, memoryLimit: val === '' ? 0 : Math.max(0, parseInt(val)) }));
                    }}
                    placeholder="Nhập số chương (VD: 10)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Chọn phong cách (20 loại)</label>
                  <select 
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2]"
                    value={newNovel.writingStyle}
                    onChange={e => setNewNovel(prev => ({ ...prev, writingStyle: e.target.value }))}
                  >
                    {WRITING_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tự thiết lập phong cách (Prompt/System)</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                    placeholder="Mô tả chi tiết phong cách bạn muốn..."
                    value={newNovel.customStyle}
                    onChange={e => setNewNovel(prev => ({ ...prev, customStyle: e.target.value }))}
                  />
                </div>

                <div className="pt-4 border-t border-[#E6CFD2]">
                  <h3 className="font-bold text-gray-800 mb-3">Prompt / Preset liên kết</h3>
                  
                  <div className="space-y-2 mb-4">
                    {newNovel.prompts?.map((p, i) => (
                      <div key={p.id} className="p-3 bg-white rounded-xl border border-[#E6CFD2] flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-[#F9C6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                        <div className="flex-1 text-sm">{p.content}</div>
                        <div className="text-xs font-bold text-[#F3B4C2] shrink-0">Độ sâu: {p.depth}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#E6CFD2]">
                    <textarea 
                      rows={2}
                      className="w-full p-2 bg-[#FAF9F6] rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm mb-2"
                      placeholder="Nội dung prompt..."
                      value={promptInput.content}
                      onChange={e => setPromptInput(prev => ({ ...prev, content: e.target.value }))}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-600">Độ sâu (1-4):</label>
                        <input 
                          type="range" min="1" max="4" 
                          value={promptInput.depth}
                          onChange={e => setPromptInput(prev => ({ ...prev, depth: parseInt(e.target.value) }))}
                          className="w-24 accent-[#F3B4C2]"
                        />
                        <span className="text-xs font-bold text-[#F3B4C2]">{promptInput.depth}</span>
                      </div>
                      <button 
                        onClick={handleAddPrompt}
                        className="px-3 py-1.5 bg-[#F9C6D4] text-white rounded-lg hover:bg-[#F3B4C2] transition-colors text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14} /> Lưu Prompt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-800">Nhân vật & Cốt truyện</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên Tiểu Thuyết</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] font-bold"
                    placeholder="Nhập tên tiểu thuyết..."
                    value={newNovel.title}
                    onChange={e => setNewNovel(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ảnh Bìa</label>
                    <label className="block w-full h-32 bg-white rounded-xl border-2 border-dashed border-[#E6CFD2] hover:border-[#F3B4C2] cursor-pointer relative overflow-hidden group">
                      {newNovel.cover ? (
                        <img src={newNovel.cover} className="w-full h-full object-cover" alt="Cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-[#F3B4C2]">
                          <ImageIcon size={24} className="mb-1" />
                          <span className="text-xs">Chọn ảnh</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'cover')} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ảnh Nền (Đọc)</label>
                    <label className="block w-full h-32 bg-white rounded-xl border-2 border-dashed border-[#E6CFD2] hover:border-[#F3B4C2] cursor-pointer relative overflow-hidden group">
                      {newNovel.background ? (
                        <img src={newNovel.background} className="w-full h-full object-cover" alt="Background" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-[#F3B4C2]">
                          <ImageIcon size={24} className="mb-1" />
                          <span className="text-xs">Chọn ảnh</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'background')} />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E6CFD2]">
                  <h3 className="font-bold text-[#F3B4C2] mb-3">Cặp đôi chính</h3>
                  <div className="space-y-3">
                    <div>
                      <input type="text" placeholder="Tên nhân vật 1" className="w-full p-2 bg-[#FAF9F6] rounded-t-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm font-bold" value={newNovel.char1?.name} onChange={e => setNewNovel(prev => ({ ...prev, char1: { ...prev.char1!, name: e.target.value } }))} />
                      <textarea rows={2} placeholder="Thông tin nhân vật 1..." className="w-full p-2 bg-[#FAF9F6] rounded-b-xl border-x border-b border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm" value={newNovel.char1?.info} onChange={e => setNewNovel(prev => ({ ...prev, char1: { ...prev.char1!, info: e.target.value } }))} />
                    </div>
                    <div>
                      <input type="text" placeholder="Tên nhân vật 2" className="w-full p-2 bg-[#FAF9F6] rounded-t-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm font-bold" value={newNovel.char2?.name} onChange={e => setNewNovel(prev => ({ ...prev, char2: { ...prev.char2!, name: e.target.value } }))} />
                      <textarea rows={2} placeholder="Thông tin nhân vật 2..." className="w-full p-2 bg-[#FAF9F6] rounded-b-xl border-x border-b border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm" value={newNovel.char2?.info} onChange={e => setNewNovel(prev => ({ ...prev, char2: { ...prev.char2!, info: e.target.value } }))} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cốt truyện (Plot)</label>
                  <textarea 
                    rows={4}
                    className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                    placeholder="Tự tạo plot hoặc để hệ thống tự tạo..."
                    value={newNovel.plot}
                    onChange={e => setNewNovel(prev => ({ ...prev, plot: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {createStep > 1 && (
              <button 
                onClick={() => setCreateStep(prev => prev - 1)}
                className="flex-1 py-3 bg-white border border-[#E6CFD2] text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} /> Quay lại
              </button>
            )}
            {createStep < 3 ? (
              <button 
                onClick={() => setCreateStep(prev => prev + 1)}
                className="flex-1 py-3 bg-[#F9C6D4] text-white font-bold rounded-xl hover:bg-[#F3B4C2] transition-colors flex items-center justify-center gap-2"
              >
                Tiếp tục <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleCreateNovel}
                className="flex-1 py-3 bg-[#F3B4C2] text-white font-bold rounded-xl hover:bg-pink-400 transition-colors flex items-center justify-center gap-2 shadow-md shadow-pink-200"
              >
                <BookOpen size={20} /> Tạo Sổ Tiểu Thuyết
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER WORKSPACE VIEW ---
  if (view === 'workspace' && currentNovel) {
    const displayedContent = selectedChapterId 
      ? (currentNovel.chapters || []).find(c => c.id === selectedChapterId)?.content 
      : currentNovel.content;

    return (
      <div className="w-full h-full flex flex-row relative bg-[#FDF2F5] shrink-0 snap-center overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`absolute lg:relative z-40 h-full bg-white/95 backdrop-blur-xl border-r border-[#F3B4C2] transition-all duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0'}`}
        >
          <div className="p-6 border-b border-[#F3B4C2] flex items-center justify-between shrink-0 w-72">
            <h3 className="font-bold text-[#F3B4C2] flex items-center gap-2">
              <History size={18} /> Danh sách chương
            </h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-[#F3B4C2]">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 w-72">
            {(currentNovel.chapters || []).length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm italic">Chưa có chương nào</div>
            ) : (
              (currentNovel.chapters || []).map((chapter, idx) => (
                <div key={chapter.id} className="relative group/item">
                  <button
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all flex flex-col gap-1 border ${selectedChapterId === chapter.id ? 'bg-[#FDF2F5] border-[#F3B4C2] text-[#F3B4C2] shadow-inner' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="font-bold text-sm">Chương {idx + 1}</span>
                    <span className="text-[10px] opacity-60">{new Date(chapter.createdAt).toLocaleString()}</span>
                  </button>
                  
                  {/* Chapter Background Upload */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <input 
                      type="file" 
                      id={`bg-upload-${chapter.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleChapterBackgroundUpload(e, chapter.id)}
                    />
                    <label 
                      htmlFor={`bg-upload-${chapter.id}`}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-[#F3B4C2] text-[#F3B4C2] hover:bg-[#FDF2F5] cursor-pointer"
                      title="Đổi hình nền chương"
                    >
                      <ImageIcon size={14} />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Background Image */}
          {(selectedChapterId ? (currentNovel.chapters.find(c => c.id === selectedChapterId)?.background || currentNovel.background) : currentNovel.background) && (
            <div 
              className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-all duration-700"
              style={{ 
                backgroundImage: `url(${selectedChapterId ? (currentNovel.chapters.find(c => c.id === selectedChapterId)?.background || currentNovel.background) : currentNovel.background})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              }}
            />
          )}
          
          {/* Header */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md border-b border-[#F3B4C2] p-3 flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[#F3B4C2] hover:bg-[#FDF2F5] rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
            <button onClick={() => setView('list')} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <img src={currentNovel.cover} alt="Cover" className="w-10 h-10 rounded-md object-cover border border-[#F3B4C2]" />
            <div className="flex-1 min-w-0">
              <h2 className="text-gray-800 font-bold text-sm truncate">{currentNovel.title}</h2>
              <p className="text-gray-500 text-xs truncate">
                {selectedChapterId 
                  ? `Đang đọc: Chương ${(currentNovel.chapters || []).findIndex(c => c.id === selectedChapterId) + 1}` 
                  : 'Bản nháp mới'}
              </p>
            </div>
            
            {/* Font Size Controls */}
            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 gap-2">
              <button 
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold"
              >
                A-
              </button>
              <span className="text-[10px] font-bold text-gray-400 w-4 text-center">{fontSize}</span>
              <button 
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold"
              >
                A+
              </button>
            </div>

            <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
              <Settings2 size={18} />
            </button>
          </div>

          {/* Novel Content Area */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 pb-32 scroll-smooth">
            <div className="max-w-2xl mx-auto">
              {displayedContent ? (
                <div className="bg-white/95 backdrop-blur-sm p-8 sm:p-12 rounded-[40px] shadow-xl border border-[#F3B4C2] min-h-[70vh]">
                  <div 
                    className="prose prose-pink max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {displayedContent}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center pt-20">
                  <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-[#F3B4C2] shadow-lg">
                    <BookOpen size={40} className="text-[#F3B4C2]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Bắt đầu chương mới</h3>
                  <p className="text-gray-500 text-sm max-w-xs">Nhập ý tưởng của bạn vào ô bên dưới để AI bắt đầu viết chương tiếp theo.</p>
                </div>
              )}
              <div ref={contentEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="relative z-20 bg-white/80 backdrop-blur-xl border-t border-[#F3B4C2] p-4 pb-safe">
            {isGenerating && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#F9C6D4] text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce border border-white">
                <Loader2 size={14} className="animate-spin" /> Đang sáng tác chương mới...
              </div>
            )}
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                rows={1}
                placeholder="Nhập ý tưởng hoặc chỉ đạo cho chương tiếp theo..."
                className="flex-1 bg-white border border-[#F3B4C2] text-gray-800 placeholder-gray-400 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] resize-none text-sm min-h-[56px] max-h-[150px] shadow-sm"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    generateStory();
                  }
                }}
                disabled={isGenerating}
              />
              <button
                onClick={generateStory}
                disabled={!userInput.trim() || isGenerating}
                className="w-14 h-14 shrink-0 bg-[#F9C6D4] hover:bg-[#F3B4C2] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90"
              >
                <Send size={24} className={userInput.trim() && !isGenerating ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
