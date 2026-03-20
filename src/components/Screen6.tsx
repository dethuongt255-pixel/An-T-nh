import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Users, Trash2 } from 'lucide-react';
import { useAppContext } from '../context';
import { NPC, CharacterSetup } from '../types';
import { CharacterSetupModal } from './CharacterSetup';
import { CharacterOS } from './CharacterOS';

export const Screen6: React.FC = () => {
  const { npcs, addNpc, deleteNpc, updateNpc, setIsSwipingDisabled } = useAppContext();
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'states'>('chats');
  
  // Modals and Views
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPC | undefined>(undefined);
  const [activeOSNpc, setActiveOSNpc] = useState<NPC | null>(null);

  React.useEffect(() => {
    if (isSetupOpen || activeOSNpc) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [isSetupOpen, activeOSNpc, setIsSwipingDisabled]);

  const handleSaveSetup = (setup: CharacterSetup, name: string, avatar: string, cover: string) => {
    if (editingNpc) {
      updateNpc(editingNpc.id, { setup, name, avatar, cover });
    } else {
      const newNpc: NPC = {
        id: Date.now().toString(),
        name: name || 'Nhân vật mới',
        avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=New',
        cover: cover || '',
        personality: '',
        speechStyle: '',
        bio: '',
        lastMessage: '...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 0,
        setup
      };
      addNpc(newNpc);
    }
    setIsSetupOpen(false);
    setEditingNpc(undefined);
  };

  const openSetup = (npc?: NPC) => {
    setEditingNpc(npc);
    setIsSetupOpen(true);
  };

  return (
    <div className="w-full h-full bg-[#FAF9F6] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-md border-b border-[#E6DDD8] flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#3A3A3A]">Nhân vật của tôi</h1>
        <div className="flex gap-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Search size={24} />
          </button>
          <button onClick={() => openSetup()} className="p-2 text-[#F3B4C2] hover:bg-[#F9C6D4]/20 rounded-full transition-colors">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 py-2 gap-6 border-b border-[#E6DDD8] bg-white/50 backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('chats')}
          className={`pb-2 font-medium transition-colors relative ${activeTab === 'chats' ? 'text-[#F3B4C2]' : 'text-gray-400'}`}
        >
          Trò chuyện
          {activeTab === 'chats' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F3B4C2] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={`pb-2 font-medium transition-colors relative ${activeTab === 'groups' ? 'text-[#F3B4C2]' : 'text-gray-400'}`}
        >
          Nhóm
          {activeTab === 'groups' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F3B4C2] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('states')}
          className={`pb-2 font-medium transition-colors relative ${activeTab === 'states' ? 'text-[#F3B4C2]' : 'text-gray-400'}`}
        >
          Trạng thái
          {activeTab === 'states' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F3B4C2] rounded-t-full" />}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {npcs.map(npc => (
          <div 
            key={npc.id} 
            className="flex items-center p-3 bg-white rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-[#E6DDD8] group relative"
          >
            <div className="relative" onClick={() => setActiveOSNpc(npc)}>
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#F3B4C2] transition-colors">
                <img src={npc.avatar} alt={npc.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 ml-4" onClick={() => setActiveOSNpc(npc)}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-[#3A3A3A] text-lg">{npc.name}</h3>
                <span className="text-xs text-gray-400 font-medium">{npc.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate pr-4">{npc.lastMessage}</p>
            </div>
            
            <div className="flex flex-col items-end gap-2 ml-2">
              {npc.badge > 0 && (
                <div className="bg-[#F3B4C2] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {npc.badge}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); openSetup(npc); }} className="text-gray-400 hover:text-[#F3B4C2]">
                  <MoreHorizontal size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteNpc(npc.id); }} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {npcs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
            <Users size={48} className="mb-4 opacity-20" />
            <p>Chưa có nhân vật nào.</p>
            <button onClick={() => openSetup()} className="mt-4 px-6 py-2 bg-[#F3B4C2] text-white rounded-full font-medium shadow-sm">
              Tạo nhân vật mới
            </button>
          </div>
        )}
      </div>

      {isSetupOpen && (
        <CharacterSetupModal 
          npc={editingNpc} 
          onClose={() => { setIsSetupOpen(false); setEditingNpc(undefined); }} 
          onSave={handleSaveSetup} 
        />
      )}

      {activeOSNpc && (
        <CharacterOS 
          npc={activeOSNpc} 
          onClose={() => setActiveOSNpc(null)} 
        />
      )}
    </div>
  );
};
