import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context';
import { Character } from '../types';

export const Screen2: React.FC = () => {
  const { themeColor, characters, addCharacter } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChar, setNewChar] = useState({
    name: '',
    username: '',
    description: '',
    image: '',
    tags: '',
  });

  const handleAdd = () => {
    if (!newChar.name || !newChar.image) return;
    
    const char: Character = {
      id: Date.now().toString(),
      name: newChar.name,
      username: newChar.username || `@${newChar.name.toLowerCase().replace(/\s+/g, '')}`,
      description: newChar.description,
      image: newChar.image,
      tags: newChar.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    
    addCharacter(char);
    setIsModalOpen(false);
    setNewChar({ name: '', username: '', description: '', image: '', tags: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewChar(prev => ({ ...prev, image: url }));
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-y-auto overflow-x-hidden shrink-0 snap-center pb-24"
      style={{ backgroundColor: themeColor }}
    >
      <div className="px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Nhân vật</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {characters.map(char => (
            <div key={char.id} className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[240px]">
              <div className="aspect-[4/3] w-full shrink-0">
                <img 
                  src={char.image} 
                  alt={char.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="shrink-0 mb-1">
                  <h3 className="font-semibold text-base text-gray-900 truncate leading-tight">{char.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{char.username}</p>
                </div>
                <div className="shrink-0 overflow-hidden mb-3">
                  <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{char.description}</p>
                </div>
                <div className="shrink-0 flex flex-wrap gap-1 content-start overflow-hidden mt-auto">
                  {char.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 bg-[#f7d7df] text-[#8a7b80] rounded-full text-[10px] font-medium flex items-center justify-center whitespace-nowrap"
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

      {/* FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-pink-500 hover:scale-105 transition-transform z-10"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Nhân vật mới</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                    {newChar.image ? (
                      <img src={newChar.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400" size={24} />
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
                      className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium inline-block"
                    >
                      Chọn từ Thư viện
                    </label>
                    <div className="text-xs text-gray-500 mt-1">Hoặc dán URL bên dưới</div>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="URL ảnh (tùy chọn nếu đã tải lên)" 
                  className="w-full mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                  value={newChar.image}
                  onChange={e => setNewChar({...newChar, image: e.target.value})}
                />
              </div>
              
              <input 
                type="text" 
                placeholder="Tên nhân vật" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                value={newChar.name}
                onChange={e => setNewChar({...newChar, name: e.target.value})}
              />
              
              <input 
                type="text" 
                placeholder="Tên người dùng (tùy chọn)" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                value={newChar.username}
                onChange={e => setNewChar({...newChar, username: e.target.value})}
              />
              
              <textarea 
                placeholder="Mô tả" 
                rows={3}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
                value={newChar.description}
                onChange={e => setNewChar({...newChar, description: e.target.value})}
              />
              
              <input 
                type="text" 
                placeholder="Thẻ (cách nhau bằng dấu phẩy)" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                value={newChar.tags}
                onChange={e => setNewChar({...newChar, tags: e.target.value})}
              />
              
              <button 
                onClick={handleAdd}
                disabled={!newChar.name || !newChar.image}
                className="w-full py-3 mt-2 bg-pink-400 hover:bg-pink-500 disabled:bg-gray-300 text-white font-bold text-base rounded-xl transition-colors"
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
