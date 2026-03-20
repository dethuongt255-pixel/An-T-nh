import React, { useState, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Book, Edit3, Trash2, User, Camera } from 'lucide-react';
import { useAppContext } from '../context';
import { Worldbook } from '../types';
import { compressImage } from '../utils/image';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Screen8: React.FC = () => {
  const { 
    worldbooks, addWorldbook, updateWorldbook, deleteWorldbook, 
    worldbookBg, setWorldbookBg, setIsSwipingDisabled,
    profile, updateProfile 
  } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useLocalStorage('rp_s8_isModalOpen', false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newWb, setNewWb] = useLocalStorage<Partial<Worldbook>>('rp_s8_newWb', {
    title: '',
    content: ''
  });

  useEffect(() => {
    if (isModalOpen) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [isModalOpen, setIsSwipingDisabled]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setWorldbookBg(base64);
      });
    }
  };

  const handleProfileUpload = (field: 'avatar' | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        compressImage(file, (base64) => {
          updateProfile({ [field]: base64 });
        });
      }
    };
    input.click();
  };

  const handleSave = () => {
    if (!newWb.title || !newWb.content) return;
    
    if (editingId) {
      updateWorldbook(editingId, { title: newWb.title, content: newWb.content });
    } else {
      addWorldbook({
        id: Date.now().toString(),
        title: newWb.title,
        content: newWb.content
      });
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewWb({ title: '', content: '' });
  };

  const handleEdit = (wb: Worldbook, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewWb({ title: wb.title, content: wb.content });
    setEditingId(wb.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa Sách Thế Giới này?')) {
      deleteWorldbook(id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-[#FAF9F6] shrink-0 snap-center overflow-hidden font-['SF_Pro',_sans-serif]">
      {/* Background Image */}
      {worldbookBg && (
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: `url(${worldbookBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 bg-[#FDF2F5]/90 backdrop-blur-md border-b border-[#F3B4C2] p-4 flex items-center justify-between shadow-sm">
        <h2 className="text-xl font-bold text-[#F3B4C2] flex items-center gap-2">
          <Book size={24} /> Sách Thế Giới & Profile
        </h2>
        
        <label className="p-2 text-[#F3B4C2] hover:bg-white rounded-full cursor-pointer transition-colors" title="Đổi hình nền">
          <ImageIcon size={24} />
          <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
        </label>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        
        {/* User Profile Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] border border-[#E6CFD2] overflow-hidden shadow-sm">
          <div className="relative h-32 bg-gray-200">
            <img src={profile.cover} alt="Cover" className="w-full h-full object-cover" />
            <button 
              onClick={() => handleProfileUpload('cover')}
              className="absolute top-2 right-2 p-2 bg-black/30 backdrop-blur rounded-full text-white hover:bg-black/50 transition-colors"
            >
              <Camera size={16} />
            </button>
          </div>
          <div className="px-6 pb-6 relative">
            <div className="absolute -top-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => handleProfileUpload('avatar')}
                  className="absolute bottom-0 right-0 p-1.5 bg-[#F3B4C2] text-white rounded-full border-2 border-white shadow-sm hover:bg-[#F9C6D4] transition-colors"
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>
            <div className="pt-14">
              <h3 className="text-xl font-bold text-[#3A3A3A]">Thông tin của tôi</h3>
              <p className="text-sm text-gray-500">Ảnh này sẽ hiển thị trong các App của Nhân vật (OS).</p>
            </div>
          </div>
        </div>

        {/* Worldbook List */}
        <div>
          <h3 className="text-lg font-bold text-[#3A3A3A] mb-4 flex items-center gap-2">
            <Book size={20} className="text-[#F3B4C2]" /> Danh sách Sách Thế Giới
          </h3>
          {worldbooks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 bg-white/40 rounded-3xl border border-dashed border-[#E6CFD2]">
              <Book size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Chưa có Sách Thế Giới nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
              {worldbooks.map(wb => (
                <div 
                  key={wb.id}
                  className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-[#E6CFD2] hover:border-[#F3B4C2] hover:shadow-lg transition-all group relative"
                >
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEdit(wb, e)} className="p-1.5 bg-white text-[#F3B4C2] rounded-lg shadow-sm hover:bg-[#FDF2F5]">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={(e) => handleDelete(wb.id, e)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg text-[#3A3A3A] mb-2 pr-16 truncate">{wb.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">{wb.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => {
          setNewWb({ title: '', content: '' });
          setEditingId(null);
          setIsModalOpen(true);
        }}
        className="absolute bottom-6 right-6 z-20 w-14 h-14 bg-[#F3B4C2] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#F9C6D4] hover:scale-105 active:scale-95 transition-all"
        title="Tạo Sách Thế Giới mới"
      >
        <Plus size={28} />
      </button>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col border border-[#E6CFD2]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-[#F3B4C2] flex items-center gap-2">
                <Book size={24} /> {editingId ? 'Sửa Sách Thế Giới' : 'Tạo Sách Thế Giới'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }} 
                className="text-gray-400 hover:text-[#F3B4C2] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Sách Thế Giới</label>
                <input 
                  type="text" 
                  value={newWb.title}
                  onChange={e => setNewWb(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Thế giới Tu Tiên, Prompt Mặc định..."
                  className="w-full bg-[#FAF9F6] border border-[#E6CFD2] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-800"
                />
              </div>
              
              <div className="flex flex-col h-64">
                <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between items-center">
                  <span>Nội dung Prompt / Preset</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewWb(prev => ({ ...prev, content: (prev.content || '') + '{{user}}' }))}
                      className="text-xs bg-[#FDF2F5] text-[#F3B4C2] px-2 py-1 rounded border border-[#F9C6D4] hover:bg-[#F9C6D4] hover:text-white transition-colors"
                    >
                      + {"{{user}}"}
                    </button>
                    <button 
                      onClick={() => setNewWb(prev => ({ ...prev, content: (prev.content || '') + '{{char}}' }))}
                      className="text-xs bg-[#FDF2F5] text-[#F3B4C2] px-2 py-1 rounded border border-[#F9C6D4] hover:bg-[#F9C6D4] hover:text-white transition-colors"
                    >
                      + {"{{char}}"}
                    </button>
                  </div>
                </label>
                <textarea 
                  value={newWb.content}
                  onChange={e => setNewWb(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Nhập prompt hệ thống, quy tắc thế giới, hoặc bối cảnh..."
                  className="w-full flex-1 bg-[#FAF9F6] border border-[#E6CFD2] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-800 font-mono resize-none"
                />
              </div>
            </div>

            <div className="mt-6 shrink-0">
              <button 
                onClick={handleSave}
                disabled={!newWb.title || !newWb.content}
                className="w-full py-3 bg-[#F3B4C2] text-white font-bold rounded-xl hover:bg-[#F9C6D4] transition-colors disabled:opacity-50 shadow-md"
              >
                Lưu Sách Thế Giới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
