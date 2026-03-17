import React, { useState, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, User, Bot } from 'lucide-react';
import { useAppContext } from '../context';
import { Character } from '../types';
import { compressImage } from '../utils/image';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Screen2: React.FC = () => {
  const { themeColor, characters, addCharacter, screen2Bg, setScreen2Bg, setIsSwipingDisabled } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useLocalStorage('rp_s2_isModalOpen', false);

  useEffect(() => {
    if (isModalOpen) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [isModalOpen, setIsSwipingDisabled]);

  const [newChar, setNewChar] = useLocalStorage<Partial<Character>>('rp_s2_newChar', {
    name: '',
    username: '',
    description: '',
    image: '',
    tags: [],
    type: 'bot',
    profile: '',
    personality: '',
    firstMessage: '',
    relationship: '',
    advancedPrompt: '',
    relatedNPCs: '',
    unrelatedNPCs: '',
    userProfile: ''
  });
  const [tagsInput, setTagsInput] = useLocalStorage('rp_s2_tagsInput', '');

  const handleAdd = () => {
    if (!newChar.name || !newChar.image) return;
    
    const char: Character = {
      id: Date.now().toString(),
      name: newChar.name,
      username: newChar.username || `@${newChar.name.toLowerCase().replace(/\s+/g, '')}`,
      description: newChar.description || '',
      image: newChar.image,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      type: newChar.type,
      profile: newChar.profile,
      personality: newChar.personality,
      firstMessage: newChar.firstMessage,
      relationship: newChar.relationship,
      advancedPrompt: newChar.advancedPrompt,
      relatedNPCs: newChar.relatedNPCs,
      unrelatedNPCs: newChar.unrelatedNPCs,
      userProfile: newChar.userProfile
    };
    
    addCharacter(char);
    setIsModalOpen(false);
    // Reset completely
    setNewChar({ 
      name: '', username: '', description: '', image: '', tags: [], type: 'bot',
      profile: '', personality: '', firstMessage: '', relationship: '', advancedPrompt: '', relatedNPCs: '', unrelatedNPCs: '', userProfile: ''
    });
    setTagsInput('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setNewChar(prev => ({ ...prev, image: base64 }));
      });
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setScreen2Bg(base64);
      });
    }
  };

  return (
    <div className="w-full h-full relative shrink-0 snap-center">
      <div 
        className="w-full h-full overflow-y-auto overflow-x-hidden pb-24"
        style={{ 
          backgroundColor: themeColor,
          backgroundImage: screen2Bg ? `url(${screen2Bg})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="px-[24px] py-12 pt-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 drop-shadow-sm text-center">Nhân vật</h2>
        
        <div className="grid grid-cols-2 gap-[20px]">
          {characters.map(char => (
            <div key={char.id} className="bg-[#FFFFFF] rounded-[16px] overflow-hidden shadow-sm flex flex-col h-[420px]">
              <div className="w-full aspect-[4/3] shrink-0 relative">
                <img 
                  src={char.image} 
                  alt={char.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {char.type === 'user' && (
                  <div className="absolute top-2 right-2 bg-[#F3B4C2] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    {`{{user}}`}
                  </div>
                )}
              </div>
              <div className="p-[12px] flex flex-col flex-1 overflow-hidden">
                <div className="mt-[10px] h-[70px] shrink-0 flex flex-col">
                  <h3 className="font-bold text-[15px] text-gray-900 truncate leading-tight">{char.name}</h3>
                  <p className="text-[12px] text-gray-500 truncate mt-1">{char.username}</p>
                </div>
                <div className="mt-[6px] h-[60px] shrink-0 overflow-hidden">
                  <p className="text-[12px] text-gray-700 line-clamp-3 leading-snug">{char.description}</p>
                </div>
                <div className="mt-[10px] h-[70px] shrink-0 flex flex-wrap gap-1 content-start overflow-hidden">
                  {char.tags?.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 bg-[#F9C6D4] text-white rounded-full text-[10px] font-medium flex items-center justify-center whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Top Right Tool Button for Background */}
      <div className="absolute top-6 right-6 z-10">
        <label className="w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md cursor-pointer hover:bg-white transition-colors">
          <ImageIcon size={20} className="text-[#F3B4C2]" />
          <input type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
        </label>
      </div>

      {/* Top Left Tool Button for Add Character */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[#F3B4C2] shadow-md flex items-center justify-center text-white hover:scale-105 transition-transform z-10"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] rounded-[24px] w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#E6CFD2]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#F3B4C2] z-10"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Thiết lập Nhân vật</h3>
            
            <div className="space-y-4">
              {/* Type Selection */}
              <div className="flex gap-4 mb-2">
                <button
                  onClick={() => setNewChar({...newChar, type: 'bot'})}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border transition-colors ${newChar.type === 'bot' ? 'bg-[#F9C6D4] text-white border-[#F3B4C2]' : 'bg-white text-gray-500 border-[#E6CFD2]'}`}
                >
                  <Bot size={18} /> Bot Char
                </button>
                <button
                  onClick={() => setNewChar({...newChar, type: 'user'})}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border transition-colors ${newChar.type === 'user' ? 'bg-[#F9C6D4] text-white border-[#F3B4C2]' : 'bg-white text-gray-500 border-[#E6CFD2]'}`}
                >
                  <User size={18} /> {`{{user}}`}
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh (Bắt buộc)</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-[#E6CFD2]">
                    {newChar.image ? (
                      <img src={newChar.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-[#D8C9C6]" size={28} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="char-image-upload"
                    />
                    <label 
                      htmlFor="char-image-upload"
                      className="cursor-pointer bg-[#F9C6D4] hover:bg-[#F3B4C2] text-white px-4 py-2.5 rounded-xl text-sm font-bold inline-block transition-colors shadow-sm"
                    >
                      Chọn từ Thư viện
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên nhân vật cơ bản</label>
                <input 
                  type="text" 
                  placeholder="Nhập tên..." 
                  className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm"
                  value={newChar.name}
                  onChange={e => setNewChar({...newChar, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên người dùng (Tùy chọn)</label>
                <input 
                  type="text" 
                  placeholder="@username" 
                  className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm"
                  value={newChar.username}
                  onChange={e => setNewChar({...newChar, username: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea 
                  placeholder="Mô tả ngắn gọn hiển thị trên thẻ..." 
                  rows={2}
                  className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                  value={newChar.description}
                  onChange={e => setNewChar({...newChar, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Thẻ (Tags)</label>
                <input 
                  type="text" 
                  placeholder="VD: tsundere, học sinh, dễ thương..." 
                  className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] text-sm"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                />
              </div>

              <div className="w-full h-px bg-[#E6CFD2] my-4"></div>

              {newChar.type === 'bot' ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#F3B4C2]">Thiết lập Bot Char</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hồ sơ nhân vật</label>
                    <textarea 
                      placeholder="Thông tin chi tiết, tiểu sử..." 
                      rows={3}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.profile}
                      onChange={e => setNewChar({...newChar, profile: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tính cách</label>
                    <textarea 
                      placeholder="Đặc điểm tính cách, thói quen..." 
                      rows={2}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.personality}
                      onChange={e => setNewChar({...newChar, personality: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung cảnh mở đầu</label>
                    <textarea 
                      placeholder="Tin nhắn đầu tiên của bot..." 
                      rows={3}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.firstMessage}
                      onChange={e => setNewChar({...newChar, firstMessage: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Lịch sử mối quan hệ với {`{{user}}`}</label>
                    <textarea 
                      placeholder="Quen biết nhau như thế nào..." 
                      rows={2}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.relationship}
                      onChange={e => setNewChar({...newChar, relationship: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tính cách chuyên sâu, code, prompt</label>
                    <textarea 
                      placeholder="Prompt hệ thống, định dạng JSON..." 
                      rows={4}
                      className="w-full p-3 bg-[#FAF9F6] rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm font-mono"
                      value={newChar.advancedPrompt}
                      onChange={e => setNewChar({...newChar, advancedPrompt: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">NPC liên quan</label>
                    <textarea 
                      placeholder="Bạn bè, gia đình, kẻ thù..." 
                      rows={2}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.relatedNPCs}
                      onChange={e => setNewChar({...newChar, relatedNPCs: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">NPC không liên quan</label>
                    <textarea 
                      placeholder="Người qua đường, nhân vật quần chúng..." 
                      rows={2}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.unrelatedNPCs}
                      onChange={e => setNewChar({...newChar, unrelatedNPCs: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#F3B4C2]">Thiết lập {`{{user}}`}</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thiết lập hồ sơ của {`{{user}}`}</label>
                    <textarea 
                      placeholder="Ngoại hình, tính cách, bối cảnh của bạn..." 
                      rows={6}
                      className="w-full p-3 bg-white rounded-xl border border-[#E6CFD2] focus:outline-none focus:border-[#F3B4C2] resize-none text-sm"
                      value={newChar.userProfile}
                      onChange={e => setNewChar({...newChar, userProfile: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleAdd}
                disabled={!newChar.name || !newChar.image}
                className="w-full py-4 mt-6 bg-[#F3B4C2] hover:bg-[#F9C6D4] disabled:bg-[#E6DDD8] text-white font-bold text-base rounded-xl transition-colors shadow-md sticky bottom-0"
              >
                Lưu Nhân vật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
