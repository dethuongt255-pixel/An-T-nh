import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Home,
  PlaySquare,
  PlusSquare,
  User,
  Heart,
  X,
  Play,
  Repeat,
  RotateCcw,
} from "lucide-react";

interface YoutubeAppProps {
  setup: any;
  apiSettings: any;
  setActiveApp: (app: any) => void;
  profile: any;
}

export const YoutubeApp: React.FC<YoutubeAppProps> = ({
  setup,
  apiSettings,
  setActiveApp,
  profile,
}) => {
  const [ytTab, setYtTab] = useState<"home" | "shorts" | "add" | "profile">(
    "home",
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [danmaku, setDanmaku] = useState<string[]>([]);
  const [isLoadingYt, setIsLoadingYt] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [userThumbnails, setUserThumbnails] = useState<string[]>([]);

  const defaultBgs = [
    "https://i.postimg.cc/G3NS3ZVY/a922b88856b69ca027ced4e29a399b92.jpg",
    "https://i.postimg.cc/9FnXQNpn/e1d0cd594c41440c5e1dadc28f25c69a.jpg",
    "https://i.postimg.cc/ryG7t9bW/0c96e9871a500d489949740a0cfe1ebd.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % defaultBgs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const background = setup.appBackground || defaultBgs[bgIndex];

  const extractYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const ytId = extractYoutubeId(searchQuery);
    if (ytId) {
      handlePlayVideo({
        id: ytId,
        title: "Video từ link",
        isRealYoutube: true,
        thumbnail: `https://img.youtube.com/vi/${ytId}/0.jpg`,
        channel: "Unknown",
        views: "0",
      });
    } else {
      setIsLoadingYt(true);
      try {
        const prompt = `Tìm kiếm bài hát hoặc video với từ khóa "${searchQuery}". Trả về JSON array gồm 10 object: { "id": "random_id", "title": "Tên video", "thumbnail": "https://picsum.photos/seed/yt/320/180", "channel": "Tên kênh", "views": "1.2M lượt xem" }. Chỉ trả về JSON array.`;
        const response = await fetch(
          apiSettings.endpoint || "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiSettings.apiKey}`,
            },
            body: JSON.stringify({
              model: apiSettings.model || "gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
            }),
          },
        );
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "[]";
        const jsonMatch = content.match(/\[.*\]/s);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        setVideos(parsed);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsLoadingYt(false);
      }
    }
  };

  const handleHeartClick = async () => {
    setIsLoadingYt(true);
    try {
      const prompt = `Đề xuất 50 video YouTube liên quan đến sở thích của người dùng. Trả về JSON array gồm 50 object: { "id": "random_id", "title": "Tên video", "thumbnail": "https://picsum.photos/seed/yt/320/180", "channel": "Tên kênh", "views": "1.2M lượt xem" }. Chỉ trả về JSON array.`;
      const response = await fetch(
        apiSettings.endpoint || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiSettings.apiKey}`,
          },
          body: JSON.stringify({
            model: apiSettings.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        },
      );
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[.*\]/s);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      setVideos(parsed);
    } catch (error) {
      console.error("Heart click error", error);
    } finally {
      setIsLoadingYt(false);
    }
  };

  const handlePlayVideo = async (video: any) => {
    setCurrentVideo(video);
    setHistory((prev) => [video, ...prev.filter((v) => v.id !== video.id)]);

    try {
      const prompt = `Tạo 100 bình luận ngắn (danmaku) cho video "${video.title}". Trả về JSON array các chuỗi string.`;
      const response = await fetch(
        apiSettings.endpoint || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiSettings.apiKey}`,
          },
          body: JSON.stringify({
            model: apiSettings.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.9,
          }),
        },
      );
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[.*\]/s);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      setDanmaku(parsed);
    } catch (error) {
      console.error("Danmaku error", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Play className="text-white w-8 h-8 fill-current" />
          </div>
          <h2 className="text-xl font-bold text-[#3A3A3A] mb-6">
            Liên kết YouTube
          </h2>
          <input
            type="email"
            placeholder="Email (Gmail)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mb-6 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={() => setIsLoggedIn(true)}
            className="w-full py-4 bg-red-500 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setActiveApp("home")}
            className="mt-4 text-gray-500 text-sm font-medium"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-[#FAFAFA]"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="pt-12 pb-4 px-6 bg-white/80 backdrop-blur-md flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Play className="text-white w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-xl text-[#3A3A3A] tracking-tight">
            YouTube
          </span>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={handleHeartClick}
            className="text-pink-500"
          >
            <Heart className="w-6 h-6 fill-current" />
          </motion.button>
          <button
            onClick={() => setActiveApp("home")}
            className="text-[#3A3A3A] bg-gray-100 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24 bg-white/60 backdrop-blur-sm">
        {ytTab === "home" && (
          <div className="p-4">
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Tìm kiếm bài hát, video hoặc dán link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
              />
              <button
                onClick={handleSearch}
                className="p-3 bg-red-500 text-white rounded-xl shadow-sm"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {isLoadingYt ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {videos.map((video, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                    onClick={() => handlePlayVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-[#3A3A3A] line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {video.channel} • {video.views}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {ytTab === "shorts" && (
          <div className="flex items-center justify-center h-full text-gray-500 font-medium">
            Shorts đang được phát triển...
          </div>
        )}

        {ytTab === "add" && (
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
              <PlusSquare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Tải video lên
            </h3>
            <p className="text-center text-gray-500 mb-8">
              Hệ thống sẽ học hỏi từ thumbnail bạn tải lên.
            </p>
            <button className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold shadow-md">
              Chọn tệp
            </button>
          </div>
        )}

        {ytTab === "profile" && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {email ? email[0].toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#3A3A3A]">
                  {email || "User"}
                </h2>
                <p className="text-gray-500">@user_youtube</p>
              </div>
            </div>

            <h3 className="font-bold text-lg text-[#3A3A3A] mb-4">
              Lịch sử xem
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-4 mb-6 snap-x">
              {history.map((video, idx) => (
                <div
                  key={idx}
                  className="min-w-[160px] snap-start cursor-pointer"
                  onClick={() => handlePlayVideo(video)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-40 h-24 object-cover rounded-xl mb-2 shadow-sm"
                  />
                  <p className="text-sm font-medium text-[#3A3A3A] line-clamp-2">
                    {video.title}
                  </p>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-400 text-sm italic">Chưa có lịch sử</p>
              )}
            </div>

            <h3 className="font-bold text-lg text-[#3A3A3A] mb-4">
              Danh sách phát
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {playlists.map((pl, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <PlaySquare className="text-gray-400" />
                  </div>
                  <p className="font-bold text-[#3A3A3A] line-clamp-1">
                    {pl.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pl.videos?.length || 0} video
                  </p>
                </div>
              ))}
              {playlists.length === 0 && (
                <p className="text-gray-400 text-sm italic col-span-2">
                  Chưa có danh sách phát
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {currentVideo && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute inset-0 z-50 bg-black flex flex-col"
          >
            <div className="relative w-full aspect-video bg-black">
              {currentVideo.isRealYoutube ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1${isLooping ? `&loop=1&playlist=${currentVideo.id}` : ""}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                  <img
                    src={currentVideo.thumbnail}
                    alt="thumbnail"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
                  />
                  <Play className="w-16 h-16 text-white/80 z-10" />

                  {/* Danmaku */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {danmaku.map((text, i) => (
                      <div
                        key={i}
                        className="absolute whitespace-nowrap text-white font-bold text-lg"
                        style={{
                          top: `${Math.random() * 80}%`,
                          animation: `danmaku ${5 + Math.random() * 5}s linear forwards`,
                          animationDelay: `${Math.random() * 10}s`,
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 bg-white p-4 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#3A3A3A]">
                    {currentVideo.title}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {currentVideo.views} • 1 ngày trước
                  </p>
                </div>
                <button
                  onClick={() => setCurrentVideo(null)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-bold text-[#3A3A3A]">
                    {currentVideo.channel}
                  </p>
                  <p className="text-xs text-gray-500">1.5M người đăng ký</p>
                </div>
                <button className="px-4 py-2 bg-black text-white rounded-full font-bold text-sm">
                  Đăng ký
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Logic for replay
                    const videoId = currentVideo.id;
                    setCurrentVideo(null);
                    setTimeout(() => setCurrentVideo({ ...currentVideo, id: videoId }), 100);
                  }}
                  className="py-3 bg-gray-100 rounded-xl font-bold text-[#3A3A3A] flex items-center justify-center gap-2 flex-1"
                >
                  <RotateCcw className="w-5 h-5" /> Phát lại
                </button>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 flex-1 ${isLooping ? "bg-red-500 text-white" : "bg-gray-100 text-[#3A3A3A]"}`}
                >
                  <Repeat className="w-5 h-5" /> {isLooping ? "Đang lặp" : "Lặp lại"}
                </button>
                <button
                  onClick={() => {
                    setPlaylists((prev) => [
                      ...prev,
                      { title: "Yêu thích", videos: [currentVideo] },
                    ]);
                    alert("Đã thêm vào danh sách phát!");
                  }}
                  className="py-3 bg-gray-100 rounded-xl font-bold text-[#3A3A3A] flex items-center justify-center gap-2 flex-1"
                >
                  <PlusSquare className="w-5 h-5" /> Thêm vào DS phát
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-4 pb-8 z-40">
        <button
          onClick={() => setYtTab("home")}
          className={`flex flex-col items-center gap-1 ${ytTab === "home" ? "text-red-500" : "text-gray-400"}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Trang chủ</span>
        </button>
        <button
          onClick={() => setYtTab("shorts")}
          className={`flex flex-col items-center gap-1 ${ytTab === "shorts" ? "text-red-500" : "text-gray-400"}`}
        >
          <PlaySquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Shorts</span>
        </button>
        <button
          onClick={() => setYtTab("add")}
          className={`flex flex-col items-center gap-1 ${ytTab === "add" ? "text-red-500" : "text-gray-400"}`}
        >
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
            <PlusSquare className="w-6 h-6 text-red-500" />
          </div>
        </button>
        <button
          onClick={() => setYtTab("profile")}
          className={`flex flex-col items-center gap-1 ${ytTab === "profile" ? "text-red-500" : "text-gray-400"}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Hồ sơ</span>
        </button>
      </div>
    </div>
  );
};
