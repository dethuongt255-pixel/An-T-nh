import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Music, List, Heart, Search, Volume2, Trash2, Plus, HardDrive, Upload, ChevronLeft, Camera, MoreVertical, Clock } from 'lucide-react';
import { useAppContext } from '../context';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

const DEFAULT_PLAYLIST: Song[] = [
  {
    id: '1',
    title: 'Lofi Study',
    artist: 'Lofi Girl',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/lofi/300/300',
  },
  {
    id: '2',
    title: 'Chill Vibes',
    artist: 'Relaxing Music',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/chill/300/300',
  },
  {
    id: '3',
    title: 'Summer Breeze',
    artist: 'Nature Sounds',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/summer/300/300',
  },
  {
    id: '4',
    title: 'Midnight City',
    artist: 'Synthwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/midnight/300/300',
  }
];

export const Screen10: React.FC = () => {
  const { profile, setIsSwipingDisabled } = useAppContext();
  const [songs, setSongs] = useLocalStorage<Song[]>('rp_s10_playlist', DEFAULT_PLAYLIST);
  const [currentSongIndex, setCurrentSongIndex] = useLocalStorage<number>('rp_s10_currentIndex', 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(true); // Assume true initially
  const [view, setView] = useState<'library' | 'player'>('library');
  const [libraryBg, setLibraryBg] = useLocalStorage<string | null>('rp_s10_libBg', null);
  const [lyrics, setLyrics] = useState<string[]>(["Đang tải lời bài hát...", "Giai điệu ngọt ngào...", "Cùng thưởng thức âm nhạc nhé!"]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSong = songs[currentSongIndex] || songs[0] || DEFAULT_PLAYLIST[0];

  // Listen for Google Auth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsDriveAuthenticated(true);
        fetchDriveFiles();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchDriveFiles = async () => {
    setIsLoadingDrive(true);
    setError(null);
    try {
      const response = await fetch('/api/drive/files');
      if (response.status === 401) {
        setIsDriveAuthenticated(false);
        setShowDrivePicker(true); // Show picker but in login state
        return;
      }
      const data = await response.json();
      if (data.files) {
        setDriveFiles(data.files);
        setIsDriveAuthenticated(true);
        setShowDrivePicker(true);
      } else {
        setError("Không tìm thấy file MP3 nào trên Google Drive.");
      }
    } catch (err) {
      console.error("Fetch Drive error:", err);
      setError("Không thể kết nối với Google Drive.");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      const popup = window.open(url, 'google_auth', 'width=600,height=700');
      if (!popup) {
        setError("Cửa sổ đăng nhập bị chặn. Vui lòng cho phép popup hoặc mở app ở tab mới.");
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Không thể mở cửa sổ đăng nhập Google.");
    }
  };

  const handleSelectDriveFile = (file: any) => {
    const newSong: Song = {
      id: `drive-${file.id}`,
      title: file.name.replace('.mp3', ''),
      artist: 'Google Drive',
      url: `/api/drive/download/${file.id}`,
      cover: file.thumbnailLink || `https://picsum.photos/seed/${file.id}/300/300`,
    };
    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    setCurrentSongIndex(updatedSongs.length - 1);
    setIsPlaying(true);
    setShowDrivePicker(false);
    setShowPlaylist(false);
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      setError("Vui lòng chọn file định dạng âm thanh (MP3, WAV...).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newSong: Song = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Từ máy của tôi',
      url: objectUrl,
      cover: `https://picsum.photos/seed/${Date.now()}/300/300`,
    };

    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    setCurrentSongIndex(updatedSongs.length - 1);
    setIsPlaying(true);
    setShowPlaylist(false);
    setError(null);
  };

  const handleLibraryBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLibraryBg(url);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, songId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSongs(songs.map(s => s.id === songId ? { ...s, cover: url } : s));
    }
  };

  const handleAddSong = () => {
    if (!newSongUrl.trim()) return;
    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle.trim() || 'Bài hát mới',
      artist: profile?.name || 'Của tôi',
      url: newSongUrl.trim(),
      cover: `https://picsum.photos/seed/${Date.now()}/300/300`,
    };
    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    setCurrentSongIndex(updatedSongs.length - 1);
    setIsPlaying(true);
    setNewSongUrl('');
    setNewSongTitle('');
    setError(null);
  };

  const handleDeleteSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs.length <= 1) return;
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);
    if (currentSongIndex >= newSongs.length) {
      setCurrentSongIndex(0);
    }
  };

  useEffect(() => {
    if (view === 'player') {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [view, setIsSwipingDisabled]);

  // Initialize Media Session API for background playback
  useEffect(() => {
    const updateMediaSession = () => {
      if ('mediaSession' in navigator && currentSong) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          album: 'Music Box',
          artwork: [
            { src: currentSong.cover, sizes: '512x512', type: 'image/png' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          setIsPlaying(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          setIsPlaying(false);
        });
        navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
        navigator.mediaSession.setActionHandler('nexttrack', handleNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
          }
        });
      }
    };

    updateMediaSession();
  }, [currentSong]);

  // Filter out invalid local blob URLs on mount (they don't persist across refreshes)
  useEffect(() => {
    const validSongs = songs.filter(song => !song.url.startsWith('blob:'));
    if (validSongs.length !== songs.length) {
      setSongs(validSongs.length > 0 ? validSongs : DEFAULT_PLAYLIST);
      if (currentSongIndex >= validSongs.length) {
        setCurrentSongIndex(0);
      }
    }
  }, []);

  // Consolidated playback control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      if (isPlaying) {
        try {
          // Ensure we have a valid URL before playing
          if (!currentSong.url) {
            setError("Lỗi: Không tìm thấy link nhạc.");
            setIsPlaying(false);
            return;
          }
          
          await audio.play();
        } catch (err: any) {
          console.error("Playback failed", err);
          if (err.name === 'NotAllowedError') {
            setError("Vui lòng nhấn Play để bắt đầu (do chính sách trình duyệt)");
          } else if (err.name === 'NotSupportedError' || err.message.includes('no supported source')) {
            setError("Không thể phát file này. Định dạng không hỗ trợ hoặc link đã hết hạn.");
          } else {
            setError("Lỗi phát nhạc. Vui lòng thử lại hoặc chọn bài khác.");
          }
          setIsPlaying(false);
        }
      } else {
        audio.pause();
      }
    };

    handlePlay();
  }, [isPlaying, currentSong.url]);

  // Load audio when URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentSong.url]);

  const handleTogglePlay = () => {
    setError(null);
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
  };

  const handlePrev = () => {
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full h-full flex flex-col relative shrink-0 snap-center overflow-hidden font-['SF_Pro',_sans-serif]">
      <audio 
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onLoadedMetadata={handleTimeUpdate}
        onError={(e) => {
          console.error("Audio element error", e);
          const audio = audioRef.current;
          if (audio && audio.error) {
            console.error("Detailed audio error:", audio.error.code, audio.error.message);
            if (audio.error.code === 4) {
              setError("Lỗi: Không tìm thấy file nhạc hoặc link đã hết hạn.");
            } else if (audio.error.code === 3) {
              setError("Lỗi: Giải mã âm thanh thất bại.");
            } else {
              setError("Lỗi: Không thể truy cập link nhạc này.");
            }
          } else {
            setError("Lỗi: Link nhạc không hợp lệ hoặc không thể truy cập.");
          }
          setIsPlaying(false);
        }}
      />

      <AnimatePresence mode="wait">
        {view === 'library' ? (
          <motion.div 
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full flex flex-col bg-white relative overflow-y-auto pb-20"
            style={{ 
              backgroundImage: libraryBg ? `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.9)), url(${libraryBg})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Library Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-pink-200 p-0.5">
                  <img 
                    src={profile?.avatar || "https://picsum.photos/seed/user/100/100"} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="Avatar" 
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Chào buổi sáng</p>
                  <h2 className="text-sm font-black text-gray-800">{profile?.name || "Người dùng"}</h2>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => bgInputRef.current?.click()} className="p-2 bg-pink-50 rounded-full text-pink-400">
                  <Camera className="w-5 h-5" />
                </button>
                <input type="file" ref={bgInputRef} onChange={handleLibraryBgUpload} className="hidden" accept="image/*" />
                <button onClick={() => setShowPlaylist(true)} className="p-2 bg-pink-50 rounded-full text-pink-400">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Banner Widget */}
            <div className="px-6 mb-6">
              <div 
                className="w-full h-[180px] rounded-[28px] border border-[#F9C6D4] shadow-sm overflow-hidden relative group"
                style={{ 
                  backgroundImage: `url(${libraryBg || 'https://picsum.photos/seed/music-banner/800/400'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Playlist của tuần</p>
                  <h3 className="text-white text-xl font-black">Giai điệu ngọt ngào ✨</h3>
                </div>
              </div>
            </div>

            {/* Stories Row */}
            <div className="mb-6">
              <p className="px-6 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nghệ sĩ nghe gần đây</p>
              <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
                {songs.slice(0, 6).map((song, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="w-[65px] h-[65px] rounded-full border-2 border-dashed border-[#F9C6D4] flex items-center justify-center p-1">
                      <img src={song.cover} className="w-[55px] h-[55px] rounded-full object-cover" alt="" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 max-w-[65px] truncate">{song.artist}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical List - Song History */}
            <div className="px-6 space-y-3 pb-32">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Lịch sử bài hát</p>
                <button className="text-[10px] font-black text-pink-400">Xem tất cả</button>
              </div>
              {songs.map((song, index) => (
                <motion.div 
                  key={song.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCurrentSongIndex(index);
                    setIsPlaying(true);
                    setView('player');
                  }}
                  className={`rounded-[20px] border-[1.5px] p-3 flex items-center gap-4 shadow-sm active:bg-pink-50 transition-all ${index === currentSongIndex ? 'bg-pink-50 border-pink-300' : 'bg-white border-[#F3B4C2]'}`}
                >
                  <img src={song.cover} className="w-[52px] h-[52px] rounded-full object-cover border-2 border-pink-50" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-gray-900 truncate">{song.title}</h4>
                    <p className="text-[12px] font-medium text-[#F3B4C2] truncate">{song.artist}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Heart className={`w-4 h-4 ${index === currentSongIndex ? 'fill-pink-500 text-pink-500' : 'text-gray-300'}`} />
                    <span className="text-[10px] font-bold text-gray-400">03:45</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mini Player Bar */}
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-20 left-4 right-4 bg-white/90 backdrop-blur-xl border border-pink-100 rounded-[24px] p-2 flex items-center gap-3 shadow-xl z-40"
              onClick={() => setView('player')}
            >
              <div className="relative w-12 h-12 shrink-0">
                <motion.img 
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  src={currentSong.cover} 
                  className="w-full h-full rounded-full object-cover border-2 border-pink-100" 
                  alt="" 
                />
                {isPlaying && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 items-end h-3 px-1 bg-pink-500 rounded-full">
                    <div className="w-0.5 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]" />
                    <div className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]" />
                    <div className="w-0.5 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-gray-800 truncate">{currentSong.title}</h4>
                <p className="text-[10px] font-bold text-pink-400 truncate">{currentSong.artist}</p>
              </div>
              <div className="flex items-center gap-1 pr-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay();
                  }}
                  className="p-2 text-pink-500 active:scale-90 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="p-2 text-gray-400 active:scale-90 transition-transform"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
            </motion.div>
          </motion.div>

        ) : (
          <motion.div 
            key="player"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full h-full flex flex-col bg-pink-50 relative overflow-hidden pb-24"
          >
            {/* Player Header */}
            <div className="p-4 flex items-center justify-between z-10 shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setView('library');
                }}
                className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-pink-100 text-pink-500 active:scale-90 transition-transform"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center flex-1 px-4">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Đang phát</span>
                <h1 className="text-xs font-black text-[#3A3A3A] truncate w-full text-center">{currentSong.title}</h1>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  coverInputRef.current?.click();
                }}
                className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-pink-100 text-pink-500 active:scale-90 transition-transform"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input 
                type="file" 
                ref={coverInputRef} 
                onChange={(e) => handleCoverUpload(e, currentSong.id)} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            {/* Error Display */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mb-2 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 z-20"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="text-[10px] font-bold text-red-500 leading-tight">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <div className="flex-1 flex flex-col items-center relative z-10 overflow-hidden">
              {/* Scrollable middle section */}
              <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center py-2 px-6">
                {/* Album Art / Disc */}
                <div className="flex items-center justify-center min-h-[160px] w-full py-4">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={currentSong.id}
                    className="relative w-44 h-44 sm:w-64 sm:h-64"
                  >
                    <div className="absolute inset-0 bg-pink-200 rounded-[40px] blur-3xl opacity-40 animate-pulse"></div>
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full relative"
                    >
                      <img 
                        src={currentSong.cover}
                        alt={currentSong.title}
                        className="w-full h-full object-cover rounded-full border-[6px] border-white shadow-2xl relative z-10"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-full z-20 shadow-inner flex items-center justify-center">
                        <div className="w-3 h-3 sm:w-6 sm:h-6 bg-pink-50 rounded-full border-2 border-pink-100"></div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Song Info & Lyrics */}
                <div className="text-center mb-2 w-full px-4 shrink-0">
                  <h2 className="text-lg font-black text-[#3A3A3A] mb-0.5 truncate">{currentSong.title}</h2>
                  <p className="text-pink-400 text-xs font-bold mb-3">{currentSong.artist}</p>
                  
                  {/* Lyric Sync UI */}
                  <div className="h-10 overflow-hidden relative flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={Math.floor(progress / 5)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-gray-600 italic px-4"
                      >
                        {lyrics[Math.floor(progress / 5) % lyrics.length]}
                      </motion.p>
                    </AnimatePresence>
                    {/* Lyric Progress Bar */}
                    <div className="mt-1 w-16 h-1 bg-pink-100 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${(progress % 5) * 20}%` }}
                        className="h-full bg-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Controls */}
              <div className="w-full bg-white/40 backdrop-blur-xl border-t border-white/20 p-6 pt-4 flex flex-col items-center shrink-0">
                {/* Progress Bar */}
                <div className="w-full max-w-xs mb-4">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500 mb-2"
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-8 mb-2">
                  <button onClick={handlePrev} className="text-gray-400 hover:text-pink-500 transition-colors active:scale-90">
                    <SkipBack className="w-8 h-8 fill-current" />
                  </button>
                  
                  <button 
                    onClick={handleTogglePlay}
                    className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-200 hover:scale-105 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>

                  <button onClick={handleNext} className="text-gray-400 hover:text-pink-500 transition-colors active:scale-90">
                    <SkipForward className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Overlay (Add Song) */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <h3 className="text-xl font-black text-[#3A3A3A]">Thêm nhạc</h3>
              <button 
                onClick={() => setShowPlaylist(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-pink-50/50 border-b border-pink-100">
              <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-xs font-bold text-pink-400 uppercase">Tùy chọn thêm</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-[10px] font-black bg-white text-pink-500 px-3 py-1.5 rounded-full border border-pink-100 shadow-sm active:scale-95 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    Chọn từ máy
                  </button>
                  <button 
                    onClick={fetchDriveFiles}
                    disabled={isLoadingDrive}
                    className="flex items-center gap-1.5 text-[10px] font-black bg-white text-blue-500 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    <HardDrive className="w-3 h-3" />
                    {isLoadingDrive ? '...' : 'Drive'}
                  </button>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLocalFileSelect} 
                accept="audio/*" 
                className="hidden" 
              />
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Tên bài hát..." 
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Link MP3 (URL)..." 
                    value={newSongUrl}
                    onChange={(e) => setNewSongUrl(e.target.value)}
                    className="flex-1 p-3 bg-white border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <button 
                    onClick={handleAddSong}
                    className="p-3 bg-pink-500 text-white rounded-2xl shadow-md active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {songs.map((song, index) => (
                <div 
                  key={song.id}
                  className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all group ${currentSongIndex === index ? 'bg-pink-50 border border-pink-100' : 'hover:bg-gray-50'}`}
                >
                  <img src={song.cover} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div className="flex-1 text-left">
                    <p className={`font-bold ${currentSongIndex === index ? 'text-pink-600' : 'text-[#3A3A3A]'}`}>{song.title}</p>
                    <p className="text-xs text-gray-400">{song.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSong(song.id, e)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Picker Modal */}
      <AnimatePresence>
        {showDrivePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-6 bg-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-2xl shadow-sm">
                    <HardDrive className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-black text-blue-900">Google Drive</h3>
                </div>
                <button 
                  onClick={() => setShowDrivePicker(false)}
                  className="p-2 bg-white/50 rounded-full text-blue-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!isDriveAuthenticated ? (
                  <div className="py-12 px-6 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <HardDrive className="w-10 h-10 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-black text-gray-800 mb-2">Kết nối Google Drive</h4>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                      Bạn cần cho phép ứng dụng truy cập vào Drive để lấy danh sách nhạc MP3 của mình.
                    </p>
                    <button 
                      onClick={handleGoogleLogin}
                      className="w-full py-4 bg-blue-500 text-white rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all mb-4"
                    >
                      Đồng ý & Đăng nhập
                    </button>
                    <a 
                      href={window.location.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 font-bold hover:underline"
                    >
                      Mở trong tab mới nếu gặp lỗi
                    </a>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Không tìm thấy file MP3 nào</p>
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <button 
                      key={file.id}
                      onClick={() => handleSelectDriveFile(file)}
                      className="w-full p-4 rounded-3xl flex items-center gap-4 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Music className="w-6 h-6" />
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-bold text-gray-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">MP3 Audio</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              <div className="p-6 bg-gray-50 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Chỉ hiển thị các file định dạng MP3</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: #ec4899;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const X = ({ className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
