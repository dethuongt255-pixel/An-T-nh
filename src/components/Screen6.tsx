import React, { useState } from 'react';
import { Plus, Search, Wifi, Battery, Signal, MoreHorizontal, MessageSquare, Users, Star, ArrowLeft, Trash2, Send, X } from 'lucide-react';
import { useAppContext } from '../context';
import { NPC } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Screen6: React.FC = () => {
  const { npcs, addNpc, deleteNpc, updateNpc, apiSettings, setIsSwipingDisabled } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'states'>('chats');
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useLocalStorage<'list' | 'chat' | 'workspace'>('rp_s6_view', 'list');
  const [currentNpcId, setCurrentNpcId] = useLocalStorage<string | null>('rp_s6_currentNpcId', null);
  const [userInput, setUserInput] = useLocalStorage('rp_s6_userInput', '');
  const [chatMessages, setChatMessages] = useLocalStorage<Record<string, { role: 'user' | 'assistant', content: string }[]>>('rp_s6_chatMessages', {});

  React.useEffect(() => {
    if (view === 'chat' || isModalOpen) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [view, isModalOpen, setIsSwipingDisabled]);
  
  const [newNpcData, setNewNpcData] = useState({
    name: '',
    avatar: '',
    cover: '',
    personality: '',
    speechStyle: '',
    bio: '',
    firstMessage: '',
  });

  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  const handleGenerateNPC = async () => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }

    const prompt = window.prompt("Nhập ý tưởng cho nhân vật (VD: Một cô gái lạnh lùng, thích đọc sách):");
    if (!prompt) return;

    setIsGeneratingProfile(true);
    
    const systemPrompt = `Bạn là một chuyên gia thiết kế nhân vật NPC cho game nhập vai.
Dựa trên ý tưởng của người dùng, hãy tạo một hồ sơ nhân vật chi tiết.
Trả về kết quả dưới định dạng JSON với các trường sau:
- name: Tên nhân vật
- personality: Tính cách chi tiết
- speechStyle: Phong cách nói chuyện
- bio: Tiểu sử ngắn
- firstMessage: Tin nhắn chào hỏi đầu tiên

Yêu cầu:
- Ngôn ngữ: Tiếng Việt.
- Văn phong: Sâu sắc, lôi cuốn.
- JSON phải hợp lệ.`;

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
      const generatedText = data.choices?.[0]?.message?.content || '';
      
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const profile = JSON.parse(jsonMatch[0]);
        setNewNpcData(prev => ({
          ...prev,
          name: profile.name || prev.name,
          personality: profile.personality || prev.personality,
          speechStyle: profile.speechStyle || prev.speechStyle,
          bio: profile.bio || prev.bio,
          firstMessage: profile.firstMessage || prev.firstMessage,
          avatar: prev.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'NPC'}`,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo hồ sơ bằng AI.");
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const handleSaveNPC = () => {
    if (!newNpcData.name || !newNpcData.avatar || !newNpcData.personality || !newNpcData.firstMessage) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, Avatar, Tính cách, Tin nhắn đầu).");
      return;
    }

    const npc: NPC = {
      id: Date.now().toString(),
      name: newNpcData.name,
      avatar: newNpcData.avatar,
      cover: newNpcData.cover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop',
      personality: newNpcData.personality,
      speechStyle: newNpcData.speechStyle || 'Bình thường',
      bio: newNpcData.bio || 'Không có tiểu sử.',
      lastMessage: newNpcData.firstMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: 0,
      apps: [],
    };
    
    addNpc(npc);
    setIsModalOpen(false);
    setNewNpcData({
      name: '',
      avatar: '',
      cover: '',
      personality: '',
      speechStyle: '',
      bio: '',
      firstMessage: '',
    });
  };

  const currentNpc = npcs.find(n => n.id === currentNpcId);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !currentNpc || isGenerating) return;
    
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }

    const npcId = currentNpc.id;
    const newUserMessage = { role: 'user' as const, content: userInput };
    const updatedMessages = [...(chatMessages[npcId] || []), newUserMessage];
    
    setChatMessages(prev => ({ ...prev, [npcId]: updatedMessages }));
    setUserInput('');
    setIsGenerating(true);
    const startTime = Date.now();

    const systemPrompt = `Bạn là ${currentNpc.name}.
Tính cách: ${currentNpc.personality}
Phong cách nói chuyện: ${currentNpc.speechStyle}
Tiểu sử: ${currentNpc.bio}

Hãy nhập vai nhân vật này và trò chuyện với người dùng. 
Yêu cầu: 
- Ngôn ngữ Tiếng Việt hoàn hảo.
- Văn phong sâu sắc, lôi cuốn như tiểu thuyết.
- Trả lời đầy đủ, không cắt ngắn, không hời hợt.
- Luôn giữ đúng thiết lập nhân vật.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
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
          messages: apiMessages,
          temperature: 0.8,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || '';
      
      if (generatedText) {
        // Ensure at least 10 seconds delay
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 10000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        setChatMessages(prev => ({ 
          ...prev, 
          [npcId]: [...updatedMessages, { role: 'assistant', content: generatedText }] 
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi trò chuyện với NPC.");
    } finally {
      setIsGenerating(false);
    }
  };

  if ((view === 'chat' || view === 'workspace') && currentNpc) {
    const messages = chatMessages[currentNpc.id] || [];
    return (
      <div className="w-full h-full relative shrink-0 snap-center bg-[#FAF9F6] flex flex-col font-['SF_Pro',_sans-serif]">
        {/* Header */}
        <div className="h-16 bg-[#F3B4C2] flex items-center justify-between px-4 shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('list')}
              className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <img src={currentNpc.avatar} alt={currentNpc.name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              <div>
                <h2 className="font-bold text-white leading-tight">{currentNpc.name}</h2>
                <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Online</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView(view === 'chat' ? 'workspace' : 'chat')}
              className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title={view === 'chat' ? 'Mở Workspace' : 'Mở Chat'}
            >
              {view === 'chat' ? <Star size={20} /> : <MessageSquare size={20} />}
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Xóa NPC này?')) {
                  deleteNpc(currentNpc.id);
                  setView('list');
                }
              }}
              className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {view === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* First Message from NPC */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[24px] p-5 shadow-sm bg-white text-[#3A3A3A] border border-[#ECE8E6] rounded-tl-sm">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed italic opacity-80 mb-2">
                    *Nhân vật xuất hiện với phong thái đặc trưng*
                  </p>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{currentNpc.lastMessage}</p>
                </div>
              </div>

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-[24px] p-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#F3B4C2] text-white rounded-tr-sm' 
                        : 'bg-white text-[#3A3A3A] border border-[#ECE8E6] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-sm border border-[#ECE8E6] rounded-[24px] rounded-tl-sm p-4 flex gap-1">
                    <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#ECE8E6] shrink-0">
              <div className="flex items-end gap-3">
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Gửi tin nhắn cho nhân vật..."
                  className="flex-1 max-h-32 p-4 bg-gray-50 rounded-[24px] border border-[#ECE8E6] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isGenerating}
                  className="w-14 h-14 rounded-full bg-[#F3B4C2] hover:bg-[#F9C6D4] disabled:bg-gray-200 text-white flex items-center justify-center shrink-0 transition-all shadow-lg active:scale-90"
                >
                  <Send size={24} className="ml-1" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
            <div className="flex justify-between items-center w-full max-w-[340px] mb-4">
              <h3 className="text-xl font-bold text-[#3A3A3A]">Workspace của {currentNpc.name}</h3>
              <button 
                onClick={() => {
                  const appName = prompt('Tên App:');
                  const appAvatar = prompt('Link Icon App:', 'https://picsum.photos/seed/app/200');
                  if (appName && appAvatar) {
                    const newApp = {
                      id: Date.now().toString(),
                      name: appName,
                      avatar: appAvatar,
                      description: '',
                      time: new Date().toLocaleTimeString(),
                      badge: 0
                    };
                    updateNpc(currentNpc.id, { apps: [...(currentNpc.apps || []), newApp] });
                  }
                }}
                className="w-6 h-6 rounded-full bg-[#F3B4C2] text-white flex items-center justify-center shadow-md active:scale-90 transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
            
            {/* iOS Folder UI for NPC Workspace */}
            <div className="scale-[0.45] origin-top sm:scale-50 md:scale-75 lg:scale-100">
              <div 
                className="folder"
                style={{ 
                  width: '720px', 
                  height: '720px', 
                  borderRadius: '60px', 
                  background: 'rgba(255,255,255,0.7)', 
                  backdropFilter: 'blur(20px)', 
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="grid"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '40px' 
                  }}
                >
                  {(currentNpc.apps || []).length === 0 ? (
                    <div className="col-span-3 h-full flex flex-col items-center justify-center text-gray-400 py-12 text-center">
                      <Star size={64} className="mb-4 opacity-20" />
                      <p className="text-2xl font-bold">Chưa có app nào cho nhân vật này</p>
                    </div>
                  ) : (
                    (currentNpc.apps || []).map(app => (
                      <div 
                        key={app.id} 
                        className="app"
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          gap: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <div 
                          className="icon"
                          style={{ 
                            width: '140px', 
                            height: '140px', 
                            borderRadius: '32px', 
                            background: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                          }}
                        >
                          <img 
                            src={app.avatar} 
                            alt={app.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span 
                          className="label"
                          style={{ 
                            fontSize: '16px', 
                            color: '#7A7A7A',
                            fontWeight: '500',
                            textAlign: 'center',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {app.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative shrink-0 snap-center bg-[#FAF9F6] flex flex-col font-['SF_Pro',_sans-serif]">
      {/* Header */}
      <div className="h-[140px] bg-[#F3B4C2] p-[20px_24px] flex flex-col justify-between shrink-0">
        <div className="flex justify-between items-center text-white/90">
          <div className="flex gap-1 items-center text-xs font-bold">
            <span>9:41</span>
          </div>
          <div className="flex gap-2 items-center">
            <Signal size={14} />
            <Wifi size={14} />
            <Battery size={14} />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Tin nhắn</h1>
          <div className="flex gap-4 text-white">
            <Search size={24} />
            <MoreHorizontal size={24} />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="h-[80px] bg-[#F3B4C2] flex justify-around items-center shrink-0">
        <button 
          onClick={() => setActiveTab('chats')}
          className={`h-full flex flex-col items-center justify-center gap-1 px-4 transition-all ${activeTab === 'chats' ? 'border-bottom-[3px] border-white text-white' : 'text-white/60'}`}
          style={{ borderBottom: activeTab === 'chats' ? '3px solid white' : 'none' }}
        >
          <MessageSquare size={24} />
          <span className="text-xs font-bold uppercase tracking-wider">Chats</span>
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={`h-full flex flex-col items-center justify-center gap-1 px-4 transition-all ${activeTab === 'groups' ? 'border-bottom-[3px] border-white text-white' : 'text-white/60'}`}
          style={{ borderBottom: activeTab === 'groups' ? '3px solid white' : 'none' }}
        >
          <Users size={24} />
          <span className="text-xs font-bold uppercase tracking-wider">Groups</span>
        </button>
        <button 
          onClick={() => setActiveTab('states')}
          className={`h-full flex flex-col items-center justify-center gap-1 px-4 transition-all ${activeTab === 'states' ? 'border-bottom-[3px] border-white text-white' : 'text-white/60'}`}
          style={{ borderBottom: activeTab === 'states' ? '3px solid white' : 'none' }}
        >
          <Star size={24} />
          <span className="text-xs font-bold uppercase tracking-wider">States</span>
        </button>
      </div>

      {/* List Item */}
      <div className="flex-1 overflow-y-auto">
        {npcs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Chưa có cuộc hội thoại nào</p>
            <p className="text-sm opacity-70 mt-2">Nhấn nút + để tạo NPC mới và bắt đầu trò chuyện</p>
          </div>
        ) : (
          npcs.map(npc => (
            <div 
              key={npc.id}
              onClick={() => { setCurrentNpcId(npc.id); setView('chat'); }}
              className="h-[120px] flex p-[16px_24px] border-b border-[#ECE8E6] bg-[#FAF9F6] active:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="relative shrink-0">
                <img src={npc.avatar} alt={npc.name} className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white shadow-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[18px] font-semibold text-[#3A3A3A] truncate">{npc.name}</span>
                  <span className="text-[12px] text-[#B5B5B5]">{npc.time}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[14px] text-[#9A9A9A] truncate pr-4">{npc.lastMessage}</p>
                  {npc.badge > 0 && (
                    <div className="bg-[#F3B4C2] text-white rounded-full w-[36px] h-[36px] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                      {npc.badge}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Float Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-[120px] right-[40px] w-6 h-6 rounded-full bg-[#F9C6D4] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
      >
        <Plus size={12} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-gray-800">Thiết lập NPC</h3>
                <button 
                  onClick={handleGenerateNPC}
                  disabled={isGeneratingProfile}
                  className="text-xs text-[#F3B4C2] font-bold mt-1 flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {isGeneratingProfile ? "Đang tạo..." : "✨ Tạo hồ sơ bằng AI"}
                </button>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Tên Nhân Vật *</label>
                <input 
                  type="text" 
                  placeholder="Nhập tên NPC..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm"
                  value={newNpcData.name}
                  onChange={e => setNewNpcData({...newNpcData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Link Ảnh Đại Diện *</label>
                <input 
                  type="text" 
                  placeholder="Dán link ảnh avatar..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm"
                  value={newNpcData.avatar}
                  onChange={e => setNewNpcData({...newNpcData, avatar: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Link Ảnh Bìa</label>
                <input 
                  type="text" 
                  placeholder="Dán link ảnh cover..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm"
                  value={newNpcData.cover}
                  onChange={e => setNewNpcData({...newNpcData, cover: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Tính Cách *</label>
                <textarea 
                  placeholder="Mô tả tính cách nhân vật..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm h-24 resize-none"
                  value={newNpcData.personality}
                  onChange={e => setNewNpcData({...newNpcData, personality: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phong Cách Nói Chuyện</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Lạnh lùng, Kiêu kỳ, Dịu dàng..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm"
                  value={newNpcData.speechStyle}
                  onChange={e => setNewNpcData({...newNpcData, speechStyle: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Tiểu Sử</label>
                <textarea 
                  placeholder="Tiểu sử ngắn về nhân vật..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm h-24 resize-none"
                  value={newNpcData.bio}
                  onChange={e => setNewNpcData({...newNpcData, bio: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Tin Nhắn Chào Hỏi *</label>
                <textarea 
                  placeholder="Câu chào đầu tiên khi bắt đầu chat..." 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-sm h-24 resize-none"
                  value={newNpcData.firstMessage}
                  onChange={e => setNewNpcData({...newNpcData, firstMessage: e.target.value})}
                />
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 shrink-0">
              <button 
                onClick={handleSaveNPC}
                className="w-full py-5 bg-[#F3B4C2] hover:bg-[#F9C6D4] text-white font-bold text-lg rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Lưu Nhân Vật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
