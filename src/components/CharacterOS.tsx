import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Settings, X, Send, Users, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context';
import { Character, SocialPost, SocialComment } from '../types';

interface CharacterOSProps {
  characterId: string;
  onClose: () => void;
}

export const CharacterOS: React.FC<CharacterOSProps> = ({ characterId, onClose }) => {
  const { characters, updateCharacter, profile, apiSettings, setIsSwipingDisabled } = useAppContext();
  const character = characters.find(c => c.id === characterId);
  const [activeApp, setActiveApp] = useState<'home' | 'social' | 'roleplay'>('home');

  useEffect(() => {
    setIsSwipingDisabled(true);
    return () => setIsSwipingDisabled(false);
  }, [setIsSwipingDisabled]);

  if (!character) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {activeApp === 'home' && (
        <div className="flex-1 bg-gray-100 p-6 flex flex-col items-center justify-center gap-8">
          <div className="absolute top-6 left-6">
            <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-8">{character.name} OS</h1>
          <div className="grid grid-cols-2 gap-8">
            <button 
              onClick={() => setActiveApp('social')}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-2xl shadow-lg flex items-center justify-center text-white">
                <Users size={36} />
              </div>
              <span className="font-medium text-gray-700">Social</span>
            </button>
            <button 
              onClick={() => setActiveApp('roleplay')}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-400 to-cyan-500 rounded-2xl shadow-lg flex items-center justify-center text-white">
                <Send size={36} />
              </div>
              <span className="font-medium text-gray-700">Roleplay</span>
            </button>
          </div>
        </div>
      )}

      {activeApp === 'social' && (
        <SocialApp character={character} onBack={() => setActiveApp('home')} />
      )}

      {activeApp === 'roleplay' && (
        <RoleplayApp character={character} onBack={() => setActiveApp('home')} />
      )}
    </div>
  );
};

const SocialApp: React.FC<{ character: Character, onBack: () => void }> = ({ character, onBack }) => {
  const { updateCharacter, apiSettings } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePosts = async () => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong Cài đặt.");
      return;
    }
    setIsGenerating(true);
    
    const systemPrompt = `Bạn là ${character.name}.
Thông tin cá nhân: ${character.description}
Tính cách: ${character.personality}
Hãy viết 20 bài đăng ngắn trên mạng xã hội thể hiện đúng tính cách và bối cảnh của bạn.
Mỗi bài đăng phải là một đối tượng JSON có thuộc tính "content".
Trả về một mảng JSON chứa 20 đối tượng này.`;

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
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.8,
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || '';
      
      try {
        // Try to parse the JSON array from the response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const postsData = JSON.parse(jsonMatch[0]);
          const newPosts: SocialPost[] = postsData.map((p: any, i: number) => ({
            id: Date.now().toString() + i,
            content: p.content,
            time: 'Vừa xong',
            likes: Math.floor(Math.random() * 1000),
            comments: []
          }));
          
          updateCharacter(character.id, {
            socialPosts: [...newPosts, ...(character.socialPosts || [])]
          });
        }
      } catch (e) {
        console.error("Failed to parse posts JSON", e);
        alert("Có lỗi khi xử lý dữ liệu từ AI. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi gọi API. Vui lòng kiểm tra lại cấu hình Proxy.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLikePost = (postId: string) => {
    const updatedPosts = character.socialPosts?.map(post => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    updateCharacter(character.id, { socialPosts: updatedPosts });
  };

  const handleComment = (postId: string) => {
    const commentContent = prompt("Nhập bình luận của bạn:");
    if (!commentContent) return;

    const updatedPosts = character.socialPosts?.map(post => {
      if (post.id === postId) {
        const newComment: SocialComment = {
          id: Date.now().toString(),
          author: 'Bạn',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
          content: commentContent
        };
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    updateCharacter(character.id, { socialPosts: updatedPosts });
  };

  return (
    <div className="flex-1 bg-[#FAF9F6] flex flex-col relative overflow-hidden">
      {/* Header / Cover */}
      <div className="h-[320px] w-full relative shrink-0 bg-[#F9C6D4]">
        <img src={character.socialProfile?.cover || character.image} alt="Cover" className="w-full h-full object-cover opacity-80" />
        <label className="absolute top-12 right-20 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-600 backdrop-blur-sm shadow-sm cursor-pointer hover:bg-white transition-colors">
          <ImageIcon size={20} />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  updateCharacter(character.id, {
                    socialProfile: {
                      ...(character.socialProfile || { followers: 0, following: 0, bio: '' }),
                      cover: reader.result as string
                    }
                  });
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
        </label>
        <button onClick={onBack} className="absolute top-12 left-6 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
          <ArrowLeft size={24} />
        </button>
        <button onClick={handleGeneratePosts} className="absolute top-12 right-6 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-pink-500 backdrop-blur-sm shadow-sm">
          <Heart size={24} className={isGenerating ? "animate-ping" : ""} />
        </button>
      </div>

      {/* Avatar */}
      <div className="absolute top-[240px] left-[40px] w-[120px] h-[120px] rounded-full border-4 border-[#FAF9F6] overflow-hidden bg-white z-10 group">
        <img src={character.image} alt="Avatar" className="w-full h-full object-cover" />
        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <ImageIcon size={24} className="text-white" />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  updateCharacter(character.id, { image: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
        </label>
      </div>

      {/* Edit Profile Button */}
      <button 
        onClick={() => {
          const newBio = prompt("Nhập tiểu sử mới:", character.socialProfile?.bio || character.description);
          if (newBio !== null) {
            updateCharacter(character.id, {
              socialProfile: {
                ...(character.socialProfile || { followers: 0, following: 0, cover: '' }),
                bio: newBio
              }
            });
          }
        }}
        className="absolute top-[260px] right-[40px] w-[220px] h-[64px] rounded-[32px] border-2 border-gray-300 font-bold text-gray-700 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 hover:bg-white transition-colors"
      >
        Edit profile
      </button>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-[100px]">
        {/* Profile Info */}
        <div className="h-[300px] px-[40px] pt-[60px] flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">{character.name}</h1>
          <p className="text-gray-500">{character.username}</p>
          <p className="mt-4 text-gray-800 line-clamp-3">{character.socialProfile?.bio || character.description}</p>
          <div className="mt-auto flex gap-6 text-sm text-gray-600">
            <span><strong>{character.socialProfile?.following || 0}</strong> Following</span>
            <span><strong>{character.socialProfile?.followers || 0}</strong> Followers</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="h-[80px] border-b border-gray-200 flex px-[40px]">
          {['Posts', 'Replies', 'Media', 'Likes'].map((tab, i) => (
            <div key={tab} className={`flex-1 flex items-center justify-center font-medium ${i === 0 ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500'}`}>
              {tab}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[1120px] px-[40px] py-4">
          {isGenerating && (
            <div className="text-center py-4 text-pink-500 animate-pulse font-medium">
              Đang tạo bài viết... Vui lòng chờ...
            </div>
          )}
          {character.socialPosts?.map(post => (
            <div key={post.id} className="min-h-[140px] py-4 border-b border-gray-100 flex gap-4">
              <img src={character.image} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{character.name}</span>
                  <span className="text-gray-500 text-sm">{post.time}</span>
                </div>
                <p className="mt-1 text-gray-800">{post.content}</p>
                <div className="mt-3 flex items-center gap-6 text-gray-500">
                  <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1 hover:text-pink-500 transition-colors"><Heart size={16} /> {post.likes}</button>
                  <button onClick={() => handleComment(post.id)} className="flex items-center gap-1 hover:text-blue-500 transition-colors"><Send size={16} /> {post.comments.length}</button>
                </div>
                {post.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                        <img src={comment.avatar} className="w-6 h-6 rounded-full object-cover" />
                        <div>
                          <span className="font-bold mr-2">{comment.author}</span>
                          <span className="text-gray-800">{comment.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-white border-t border-gray-200 flex items-center justify-around px-[40px]">
        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500"><Heart size={24} /></div>
        <div className="w-12 h-12 flex items-center justify-center text-gray-400"><Send size={24} /></div>
        <div className="w-12 h-12 flex items-center justify-center text-gray-400"><Users size={24} /></div>
        <div className="w-12 h-12 flex items-center justify-center text-gray-400"><Settings size={24} /></div>
      </div>
    </div>
  );
};

const RoleplayApp: React.FC<{ character: Character, onBack: () => void }> = ({ character, onBack }) => {
  const { updateCharacter, apiSettings, profile } = useAppContext();
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatSettings = character.chatSettings || {
    background: '',
    offlineLength: 500,
    onlineLength: 100,
    memoryMessageCount: 10,
    memoryTokenCount: 2000
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [character.chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;
    
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      alert("Vui lòng cấu hình API Proxy trong Cài đặt.");
      return;
    }

    const newUserMessage = { role: 'user' as const, content: userInput };
    const updatedMessages = [...(character.chatMessages || []), newUserMessage];
    
    updateCharacter(character.id, { chatMessages: updatedMessages });
    setUserInput('');
    setIsGenerating(true);

    const systemPrompt = `Bạn là ${character.name}.
Thông tin cá nhân: ${character.description}
Tính cách: ${character.personality}
Mối quan hệ với người dùng: ${character.relationship}
Thông tin người dùng: ${character.userProfile}
Bộ nhớ dài hạn: ${character.memory || 'Không có'}

Hãy đóng vai nhân vật này và trả lời người dùng.
Độ dài câu trả lời khoảng ${chatSettings.offlineLength} ký tự.`;

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
      const tokensUsed = data.usage?.total_tokens || 0;
      
      if (generatedText) {
        updateCharacter(character.id, { 
          chatMessages: [...updatedMessages, { role: 'assistant', content: generatedText }],
          tokenCount: (character.tokenCount || 0) + tokensUsed
        });
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi gọi API. Vui lòng kiểm tra lại cấu hình Proxy.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative" style={{ backgroundColor: chatSettings.background || '#FAF9F6', backgroundImage: chatSettings.background ? `url(${chatSettings.background})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <img src={character.image} alt={character.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
            <div>
              <h2 className="font-bold text-gray-800 leading-tight">{character.name}</h2>
              <p className="text-[10px] text-gray-500">Tokens: {character.tokenCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full hover:bg-pink-50 flex items-center justify-center text-pink-500">
            <Users size={24} />
          </button>
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="absolute top-16 right-0 w-64 bg-white shadow-xl border border-gray-200 rounded-bl-2xl p-4 z-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Cài đặt Roleplay</h3>
            <button onClick={() => setIsSettingsOpen(false)}><X size={20} className="text-gray-500" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Độ dài tin nhắn (Offline)</label>
              <input type="range" min="100" max="2000" step="100" value={chatSettings.offlineLength} onChange={e => updateCharacter(character.id, { chatSettings: { ...chatSettings, offlineLength: parseInt(e.target.value) } })} className="w-full" />
              <div className="text-xs text-gray-500 text-right">{chatSettings.offlineLength} ký tự</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Độ dài tin nhắn (Online)</label>
              <input type="range" min="50" max="500" step="50" value={chatSettings.onlineLength} onChange={e => updateCharacter(character.id, { chatSettings: { ...chatSettings, onlineLength: parseInt(e.target.value) } })} className="w-full" />
              <div className="text-xs text-gray-500 text-right">{chatSettings.onlineLength} ký tự</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(character.chatMessages || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <img src={character.image} alt={character.name} className="w-24 h-24 rounded-full object-cover opacity-50 grayscale" />
            <p className="text-center max-w-xs">
              Bắt đầu trò chuyện với <strong>{character.name}</strong>.
            </p>
          </div>
        ) : (
          (character.chatMessages || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && <img src={character.image} className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 self-end" />}
              <div 
                className={`max-w-[75%] rounded-2xl p-3 ${
                  msg.role === 'user' 
                    ? 'bg-pink-500 text-white rounded-br-sm' 
                    : 'bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
              {msg.role === 'user' && <img src={profile.avatar} className="w-8 h-8 rounded-full object-cover ml-2 shrink-0 self-end" />}
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <img src={character.image} className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 self-end" />
            <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm p-4 flex gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200 shrink-0">
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
            className="flex-1 max-h-32 p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
            rows={1}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isGenerating}
            className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <Send size={20} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
