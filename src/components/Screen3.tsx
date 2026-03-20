import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Camera, Send, Trash2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context';
import { AppItem } from '../types';
import { safeApiCall } from '../utils/api';
import { compressImage } from '../utils/image';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Screen3: React.FC = () => {
  const { themeColor, apps, addApp, updateApp, deleteApp, profile, updateProfile, apiSettings, setIsSwipingDisabled, npcs } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useLocalStorage('rp_s3_isModalOpen', false);
  const [view, setView] = useLocalStorage<'list' | 'workspace'>('rp_s3_view', 'list');
  const [currentAppId, setCurrentAppId] = useLocalStorage<string | null>('rp_s3_currentAppId', null);

  useEffect(() => {
    if (isModalOpen || view === 'workspace') {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [isModalOpen, view, setIsSwipingDisabled]);

  const [isCreating, setIsCreating] = useState(false);
  const [newApp, setNewApp] = useLocalStorage('rp_s3_newApp', {
    name: '',
    avatar: '',
    description: '',
    functions: '',
    content: '',
  });

  const [isGeneratingAppProfile, setIsGeneratingAppProfile] = useState(false);

  const handleGenerateApp = async () => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt.");
      return;
    }

    const prompt = window.prompt("Nhập ý tưởng cho App (VD: App tư vấn tình yêu, App giải toán):");
    if (!prompt) return;

    setIsGeneratingAppProfile(true);
    
    const systemPrompt = `Bạn là một chuyên gia thiết kế ứng dụng AI.
Dựa trên ý tưởng của người dùng, hãy tạo một hồ sơ ứng dụng chi tiết.
Trả về kết quả dưới định dạng JSON với các trường sau:
- name: Tên ứng dụng
- description: Mô tả ngắn gọn
- functions: Các chức năng chính
- content: Kiến thức hoặc nội dung đặc thù của ứng dụng

Yêu cầu:
- Ngôn ngữ: Tiếng Việt.
- Văn phong: Chuyên nghiệp, hiện đại.
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
        setNewApp(prev => ({
          ...prev,
          name: profile.name || prev.name,
          description: profile.description || prev.description,
          functions: profile.functions || prev.functions,
          content: profile.content || prev.content,
          avatar: prev.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.name || 'App'}`,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo hồ sơ App bằng AI.");
    } finally {
      setIsGeneratingAppProfile(false);
    }
  };

  const handleAdd = () => {
    if (!newApp.name || !newApp.avatar) return;
    
    setIsCreating(true);
    
    // Simulate API delay (10 seconds as requested)
    setTimeout(() => {
      const app: AppItem = {
        id: Date.now().toString(),
        name: newApp.name,
        avatar: newApp.avatar,
        description: newApp.description,
        functions: newApp.functions,
        content: newApp.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: Math.floor(Math.random() * 100) + 1,
        messages: [],
      };
      
      addApp(app);
      setIsCreating(false);
      setIsModalOpen(false);
      setNewApp({ name: '', avatar: '', description: '', functions: '', content: '' });
    }, 10000); // 10 seconds delay
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'background' | 'appAvatar') => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        if (type === 'appAvatar') {
          setNewApp(prev => ({ ...prev, avatar: base64 }));
        } else {
          updateProfile({ [type]: base64 });
        }
      });
    }
  };

  const currentApp = apps.find(a => a.id === currentAppId);
  const [userInput, setUserInput] = useLocalStorage('rp_s3_userInput', '');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'workspace') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentApp?.messages, view]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !currentApp || isGenerating) return;
    
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong phần Cài đặt trước khi sử dụng.");
      return;
    }

    const newUserMessage = { role: 'user' as const, content: userInput };
    const updatedMessages = [...(currentApp.messages || []), newUserMessage];
    
    updateApp(currentApp.id, { messages: updatedMessages });
    setUserInput('');
    setIsGenerating(true);
    const startTime = Date.now();

    const systemPrompt = `Bạn là một ứng dụng có tên "${currentApp.name}".
Mô tả ứng dụng: ${currentApp.description}
Chức năng ứng dụng: ${currentApp.functions || 'Không có'}
Nội dung/Kiến thức ứng dụng: ${currentApp.content || 'Không có'}

Hãy đóng vai ứng dụng này và trả lời người dùng một cách phù hợp nhất với mô tả và chức năng trên.
Yêu cầu: 
- Ngôn ngữ Tiếng Việt hoàn hảo.
- Văn phong chuyên nghiệp, lôi cuốn.
- Trả lời đầy đủ, không cắt ngắn.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const generatedText = await safeApiCall({
        endpoint: apiSettings.endpoint,
        apiKey: apiSettings.apiKey,
        model: apiSettings.model,
        messages: apiMessages,
        temperature: 0.7,
      });

      if (generatedText) {
        // Ensure at least 10 seconds delay
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 10000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        updateApp(currentApp.id, { 
          messages: [...updatedMessages, { role: 'assistant', content: generatedText }] 
        });
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi gọi API. Vui lòng kiểm tra lại cấu hình Proxy.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (view === 'workspace' && currentApp) {
    return (
      <div className="w-full h-full relative shrink-0 snap-center bg-[#FAF9F6] flex flex-col font-['SF_Pro',_sans-serif]">
        {/* Header */}
        <div className="h-16 bg-white border-b border-[#E6CFD2] flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('list')}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <img src={currentApp.avatar} alt={currentApp.name} className="w-10 h-10 rounded-full object-cover border border-[#E6CFD2]" />
              <div>
                <h2 className="font-bold text-[#3A3A3A] leading-tight">{currentApp.name}</h2>
                <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{currentApp.description}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa app này?')) {
                deleteApp(currentApp.id);
                setView('list');
              }
            }}
            className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(currentApp.messages || []).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <img src={currentApp.avatar} alt={currentApp.name} className="w-24 h-24 rounded-full object-cover opacity-50 grayscale" />
              <p className="text-center max-w-xs text-sm">
                Bắt đầu trò chuyện với <strong>{currentApp.name}</strong>.
              </p>
            </div>
          ) : (
            (currentApp.messages || []).map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-[20px] p-4 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#F3B4C2] text-white rounded-tr-sm' 
                      : 'bg-white text-[#3A3A3A] border border-[#E6CFD2] rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border border-[#E6CFD2] rounded-[20px] rounded-tl-sm p-4 flex gap-1">
                <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-[#E6CFD2] shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập tin nhắn..."
              className="flex-1 max-h-32 p-4 bg-gray-50 rounded-[20px] border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isGenerating}
              className="w-12 h-12 rounded-full bg-[#F3B4C2] hover:bg-[#F9C6D4] disabled:bg-gray-200 text-white flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90"
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative shrink-0 snap-center font-['SF_Pro',_sans-serif]">
      <div 
        className="w-full h-full overflow-y-auto overflow-x-hidden pb-24"
        style={{ backgroundColor: '#FAF9F6' }}
      >
        {/* Profile Header */}
        <div className="relative h-64 w-full bg-[#E6DDD8] group">
          <img 
            src={profile.cover} 
            alt="Cover" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <Camera className="text-white" size={32} />
            <input type="file" accept="image/*" onChange={e => handleImageChange(e, 'cover')} className="hidden" />
          </label>
          
          <div className="absolute -bottom-12 left-6 group/avatar">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white relative shadow-md">
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="text-white" size={24} />
                <input type="file" accept="image/*" onChange={e => handleImageChange(e, 'avatar')} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-16 px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#3A3A3A]">Ứng dụng của tôi</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-10 h-10 rounded-2xl bg-[#F3B4C2] shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* Responsive App Grid (Replaces old fixed-scale folder) */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-6 shadow-sm border border-white/40 min-h-[400px]">
            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
              {apps.length === 0 ? (
                <div className="col-span-3 h-64 flex flex-col items-center justify-center text-gray-400 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus size={24} />
                  </div>
                  <p className="text-sm">Chưa có ứng dụng nào.<br/>Nhấn + để tạo mới!</p>
                </div>
              ) : (
                apps.map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => { 
                      setCurrentAppId(app.id);
                      setView('workspace');
                    }}
                    className="flex flex-col items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-white shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all duration-300 border border-gray-50">
                      <img 
                        src={app.avatar} 
                        alt={app.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 text-center w-full truncate px-1">
                      {app.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-[#FAF9F6] rounded-[40px] w-full max-w-md p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border border-[#E6CFD2] scrollbar-hide">
            {!isCreating && (
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setNewApp({ name: '', avatar: '', description: '', functions: '', content: '' });
                }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#F3B4C2] hover:bg-[#FDF2F5] transition-all"
              >
                <X size={20} />
              </button>
            )}
            
            {isCreating ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 border-4 border-[#F3B4C2] border-t-transparent rounded-full animate-spin mb-8 shadow-inner"></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Đang xây dựng App...</h3>
                <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">Tạo App Mới</h3>
                  <button 
                    onClick={handleGenerateApp}
                    disabled={isGeneratingAppProfile}
                    className="text-sm text-[#F3B4C2] font-bold mt-2 flex items-center gap-2 hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    <span className="bg-[#FDF2F5] p-1 rounded-lg">✨</span> Thiết kế App bằng AI
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Biểu tượng App</label>
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-24 rounded-[32px] bg-white flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-[#E6CFD2] shadow-sm">
                        {newApp.avatar ? (
                          <img src={newApp.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#D8C9C6]" size={32} />
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => handleImageChange(e, 'appAvatar')}
                          className="hidden"
                          id="app-image-upload"
                        />
                        <label 
                          htmlFor="app-image-upload"
                          className="cursor-pointer bg-white border border-[#F3B4C2] text-[#F3B4C2] hover:bg-[#FDF2F5] px-5 py-3 rounded-2xl text-xs font-bold inline-block transition-all shadow-sm active:scale-95"
                        >
                          Chọn từ Thư viện
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Tên App</label>
                    <input 
                      type="text" 
                      placeholder="Nhập tên app..." 
                      className="w-full p-4 bg-white rounded-2xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm shadow-sm"
                      value={newApp.name}
                      onChange={e => setNewApp({...newApp, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Mô tả</label>
                    <textarea 
                      placeholder="Mô tả app mong muốn..." 
                      rows={2}
                      className="w-full p-4 bg-white rounded-2xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm shadow-sm"
                      value={newApp.description}
                      onChange={e => setNewApp({...newApp, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Chức năng</label>
                    <textarea 
                      placeholder="Chức năng chính của app..." 
                      rows={2}
                      className="w-full p-4 bg-white rounded-2xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm shadow-sm"
                      value={newApp.functions}
                      onChange={e => setNewApp({...newApp, functions: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Nội dung xây dựng</label>
                    <textarea 
                      placeholder="Kiến thức hoặc nội dung đặc thù..." 
                      rows={2}
                      className="w-full p-4 bg-white rounded-2xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm shadow-sm"
                      value={newApp.content}
                      onChange={e => setNewApp({...newApp, content: e.target.value})}
                    />
                  </div>
                  
                  <button 
                    onClick={handleAdd}
                    disabled={!newApp.name || !newApp.avatar || isCreating}
                    className="w-full py-5 mt-4 bg-[#F3B4C2] hover:bg-[#F9C6D4] disabled:bg-gray-200 text-white font-bold text-lg rounded-[24px] transition-all shadow-lg active:scale-95"
                  >
                    Tạo App
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
