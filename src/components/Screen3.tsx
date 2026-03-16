import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon, Camera } from 'lucide-react';
import { useAppContext } from '../context';
import { AppItem } from '../types';

export const Screen3: React.FC = () => {
  const { themeColor, apps, addApp, profile, updateProfile } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    avatar: '',
    description: '',
    functions: '',
    content: '',
  });

  const handleAdd = () => {
    if (!newApp.name || !newApp.avatar) return;
    
    setIsCreating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const app: AppItem = {
        id: Date.now().toString(),
        name: newApp.name,
        avatar: newApp.avatar,
        description: newApp.description,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: Math.floor(Math.random() * 100) + 1,
      };
      
      addApp(app);
      setIsCreating(false);
      setIsModalOpen(false);
      setNewApp({ name: '', avatar: '', description: '', functions: '', content: '' });
    }, 2000); // 2 seconds delay
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'background' | 'appAvatar') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'appAvatar') {
        setNewApp(prev => ({ ...prev, avatar: url }));
      } else {
        updateProfile({ [type]: url });
      }
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-y-auto overflow-x-hidden shrink-0 snap-center pb-24"
      style={{ backgroundColor: profile.background || themeColor }}
    >
      {/* Profile Header */}
      <div className="relative h-64 w-full bg-gray-200 group">
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
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white relative">
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
        <h2 className="text-3xl font-bold text-gray-800 mb-6">App của tôi</h2>
        
        <div className="space-y-4">
          {apps.length === 0 ? (
            <div className="text-center text-lg text-gray-500 py-8">
              Chưa có app nào. Hãy tạo mới!
            </div>
          ) : (
            apps.map(app => (
              <div key={app.id} className="flex items-center p-4 h-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                <img 
                  src={app.avatar} 
                  alt={app.name} 
                  className="w-16 h-16 rounded-full object-cover mr-4 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-gray-900 truncate">{app.name}</div>
                  <div className="text-sm text-gray-500 truncate">{app.description}</div>
                </div>
                <div className="text-right ml-3 shrink-0 flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-400">{app.time}</div>
                  {app.badge > 0 && (
                    <div className="bg-[#f7b6c2] text-white rounded-full px-2 py-0.5 text-xs font-medium leading-none">
                      {app.badge}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
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
            {!isCreating && (
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            )}
            
            {isCreating ? (
              <div className="py-8 flex flex-col items-center justify-center text-center bg-[#F9C6D4] rounded-2xl p-6">
                <div className="w-12 h-12 border-4 border-white border-t-pink-500 rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">Đang làm việc...</h3>
                <p className="text-sm text-white/90 font-medium">Vui lòng chờ trong giây lát</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-6 text-gray-800">Tạo App Mới</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biểu tượng App</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                        {newApp.avatar ? (
                          <img src={newApp.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={24} />
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
                          className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium inline-block"
                        >
                          Chọn từ Thư viện
                        </label>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Hoặc dán URL ảnh" 
                      className="w-full mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                      value={newApp.avatar}
                      onChange={e => setNewApp({...newApp, avatar: e.target.value})}
                    />
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Tên app" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                    value={newApp.name}
                    onChange={e => setNewApp({...newApp, name: e.target.value})}
                  />
                  
                  <textarea 
                    placeholder="Mô tả app mong muốn" 
                    rows={2}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
                    value={newApp.description}
                    onChange={e => setNewApp({...newApp, description: e.target.value})}
                  />

                  <textarea 
                    placeholder="Chức năng app" 
                    rows={2}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
                    value={newApp.functions}
                    onChange={e => setNewApp({...newApp, functions: e.target.value})}
                  />

                  <textarea 
                    placeholder="Nội dung muốn xây dựng app" 
                    rows={2}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
                    value={newApp.content}
                    onChange={e => setNewApp({...newApp, content: e.target.value})}
                  />
                  
                  <button 
                    onClick={handleAdd}
                    disabled={!newApp.name || !newApp.avatar}
                    className="w-full py-3 mt-2 bg-pink-400 hover:bg-pink-500 disabled:bg-gray-300 text-white font-bold text-base rounded-xl transition-colors"
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
