import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Camera, ChevronRight, ChevronLeft, BookOpen, Send, Loader2, Settings2, Trash2 } from 'lucide-react';
import { useAppContext } from '../context';
import { Novel, NovelCategory, NovelPrompt } from '../types';
import { compressImage } from '../utils/image';
import { useLocalStorage } from '../hooks/useLocalStorage';

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
    content: ''
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setNewNovel(prev => ({ ...prev, [field]: base64 }));
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
      content: ''
    };
    addNovel(novel);
    setView('list');
    setCreateStep(1);
    // Reset state
    setNewNovel({
      title: '', cover: '', background: '',
      categories: PREDEFINED_CATEGORIES.map(name => ({ id: Date.now().toString() + Math.random(), name, tags: [] })),
      chapterLength: 1000, writingStyle: WRITING_STYLES[0], customStyle: '', prompts: [],
      char1: { name: '', info: '' }, char2: { name: '', info: '' }, plot: '', content: ''
    });
  };

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

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Nội dung truyện hiện tại:\n${currentNovel.content}\n\nÝ tưởng cho đoạn tiếp theo: ${userInput}` }
    ];

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
          messages: messages,
          temperature: 0.7,
          max_tokens: currentNovel.chapterLength > 0 ? Math.max(4000, Math.ceil(currentNovel.chapterLength / 2)) : 8192,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || '';
      
      if (generatedText) {
        const newContent = currentNovel.content + (currentNovel.content ? '\n\n' : '') + generatedText;
        updateNovel(currentNovel.id, { content: newContent });
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
              className="w-10 h-10 rounded-full bg-[#F9C6D4] text-white flex items-center justify-center shadow-md hover:bg-[#F3B4C2] transition-colors"
            >
              <Plus size={24} />
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
              <h2 className="text-2xl font-bold text-gray-800">Thể loại & Hạng mục</h2>
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
    return (
      <div className="w-full h-full flex flex-col relative bg-black shrink-0 snap-center">
        {/* Background Image */}
        {currentNovel.background && (
          <div 
            className="absolute inset-0 z-0 opacity-40"
            style={{ backgroundImage: `url(${currentNovel.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        
        {/* Header */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md border-b border-white/10 p-3 flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <img src={currentNovel.cover} alt="Cover" className="w-10 h-10 rounded-md object-cover border border-white/20" />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm truncate">{currentNovel.title}</h2>
            <p className="text-white/60 text-xs truncate">{currentNovel.writingStyle}</p>
          </div>
          <button className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
            <Settings2 size={18} />
          </button>
        </div>

        {/* Novel Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 pb-32 scroll-smooth">
          <div className="max-w-2xl mx-auto">
            {currentNovel.content ? (
              <div className="bg-[#FAF9F6]/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20">
                <div className="prose prose-pink max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentNovel.content}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center pt-20">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                  <BookOpen size={32} className="text-white/80" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bắt đầu câu chuyện</h3>
                <p className="text-white/60 text-sm max-w-xs">Nhập ý tưởng của bạn vào ô bên dưới để AI bắt đầu viết chương đầu tiên.</p>
              </div>
            )}
            <div ref={contentEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="relative z-20 bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 pb-safe">
          {isGenerating && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#F9C6D4] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
              <Loader2 size={14} className="animate-spin" /> Đang viết truyện...
            </div>
          )}
          <div className="max-w-2xl mx-auto flex gap-2">
            <textarea
              rows={1}
              placeholder="Nhập ý tưởng hoặc chỉ đạo cho đoạn tiếp theo..."
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#F9C6D4] resize-none text-sm min-h-[48px] max-h-[120px]"
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
              className="w-12 h-12 shrink-0 bg-[#F9C6D4] hover:bg-[#F3B4C2] disabled:bg-white/10 disabled:text-white/30 text-white rounded-2xl flex items-center justify-center transition-colors"
            >
              <Send size={20} className={userInput.trim() && !isGenerating ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
