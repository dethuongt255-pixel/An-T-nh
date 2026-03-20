import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Image as ImageIcon,
  Video,
  PhoneOff,
  Plus,
} from "lucide-react";
import { NPC, CharacterSetup } from "../types";
import { useAppContext } from "../context";
import { motion, AnimatePresence } from "motion/react";
import { safeApiCall } from "../utils/api";

const defaultSetup: CharacterSetup = {
  promptPreset: "",
  history: "",
  relationship: "",
  systemBeforeAfterLove: "",
  longNovelMode: false,
  longNovelLength: 1000,
  nsfwEnabled: false,
  nsfwRules: "",
  events: [],
  advancedSetup: "",
  openingScene: "",
  appBackground: "",
  osHeaderImage: "",
  osDividerImage: "",
  osDockIcons: [],
  osAppIcons: {},
  osAppIconBackgrounds: {},
  osAppIconSize: 64,
};

interface Props {
  npc?: NPC;
  characterId?: string;
  onClose: () => void;
}

export const CharacterOS: React.FC<Props> = ({
  npc: propNpc,
  characterId,
  onClose,
}) => {
  const [activeApp, setActiveApp] = useState<
    "home" | "roleplay" | "messenger" | "videocall" | "instagram"
  >("home");
  const [activeChat, setActiveChat] = useState<NPC | "main" | null>(null);
  const [rpTab, setRpTab] = useState<"npcs" | "main">("npcs");
  const {
    npcs,
    updateNpc,
    addNpc,
    characters,
    updateCharacter,
    apiSettings,
    worldbooks,
    profile,
  } = useAppContext();

  // Fake video call state
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Map character to NPC format if characterId is provided
  const character = characterId
    ? characters.find((c) => c.id === characterId)
    : null;
  const isCharacterMode = !!characterId;

  const npc: NPC | null =
    propNpc ||
    (character
      ? {
          id: character.id,
          name: character.name,
          avatar: character.image,
          cover: "",
          personality: character.personality || "",
          speechStyle: "",
          bio: character.description || "",
          lastMessage: "",
          time: "",
          badge: 0,
          messages: character.chatMessages || [],
          setup: {
            promptPreset: character.advancedPrompt || "",
            history: "",
            relationship: character.relationship || "",
            systemBeforeAfterLove: "",
            longNovelMode: false,
            longNovelLength: 1000,
            nsfwEnabled: false,
            nsfwRules: "",
            events: [],
            advancedSetup: "",
            openingScene: character.firstMessage || "",
            appBackground: "",
            osHeaderImage: "",
            osDividerImage: "",
            osDockIcons: [],
            osAppIcons: {},
          },
        }
      : null);

  if (!npc) return null;

  const setup = npc.setup || ({} as CharacterSetup);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoCalling) {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isVideoCalling]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const endCall = () => {
    setIsVideoCalling(false);
    alert(`Cuộc gọi kết thúc. Thời lượng: ${formatTime(callDuration)}`);
    setCallDuration(0);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    const targetNpc = activeChat === "main" ? npc : (activeChat as NPC);
    const currentMessages = targetNpc.messages || [];
    const newMessage = { role: "user" as const, content: messageInput };
    const updatedMessages = [...currentMessages, newMessage];

    // Update UI immediately
    if (isCharacterMode && activeChat === "main") {
      updateCharacter(targetNpc.id, {
        chatMessages: updatedMessages as any,
      });
    } else {
      updateNpc(targetNpc.id, {
        messages: updatedMessages,
        lastMessage: messageInput,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
    setMessageInput("");
    setIsLoading(true);

    try {
      // Construct system prompt based on setup
      let systemPrompt = `Bạn là ${targetNpc.name}. ${targetNpc.personality} ${targetNpc.speechStyle} ${targetNpc.bio}`;

      if (targetNpc.setup) {
        const s = targetNpc.setup;
        systemPrompt += `\n\n${s.promptPreset}`;

        if (s.worldbookId) {
          const wb = worldbooks.find((w) => w.id === s.worldbookId);
          if (wb) {
            let wbContent = wb.content.replace(/\{\{char\}\}/g, targetNpc.name);
            wbContent = wbContent.replace(
              /\{\{user\}\}/g,
              profile.name || "User",
            );
            systemPrompt += `\n\n[SÁCH THẾ GIỚI - ${wb.title}]:\n${wbContent}`;
          }
        }

        if (s.history) systemPrompt += `\nLịch sử: ${s.history}`;
        if (s.relationship) systemPrompt += `\nMối quan hệ: ${s.relationship}`;
        if (s.systemBeforeAfterLove)
          systemPrompt += `\nTrạng thái tình cảm: ${s.systemBeforeAfterLove}`;
        if (s.nsfwEnabled && s.nsfwRules)
          systemPrompt += `\nQuy tắc NSFW: ${s.nsfwRules}`;
        if (s.advancedSetup)
          systemPrompt += `\nThiết lập nâng cao: ${s.advancedSetup}`;

        if (s.events && s.events.length > 0) {
          systemPrompt += `\nSự kiện quan trọng (Kích hoạt khi nhắc đến từ khóa):`;
          s.events.forEach((e) => {
            systemPrompt += `\n- Từ khóa: ${e.keywords} -> Nội dung: ${e.content}`;
          });
        }
      }

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const assistantMessage = await safeApiCall({
        endpoint:
          apiSettings.endpoint || "https://api.openai.com/v1/chat/completions",
        apiKey: apiSettings.apiKey,
        model: apiSettings.model || "gpt-3.5-turbo",
        messages: apiMessages,
        max_tokens: targetNpc.setup?.longNovelMode
          ? targetNpc.setup.longNovelLength
          : 1000,
      });

      if (isCharacterMode && activeChat === "main") {
        updateCharacter(targetNpc.id, {
          chatMessages: [
            ...updatedMessages,
            { role: "assistant", content: assistantMessage },
          ] as any,
        });
      } else {
        updateNpc(targetNpc.id, {
          messages: [
            ...updatedMessages,
            { role: "assistant", content: assistantMessage },
          ],
          lastMessage: assistantMessage,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Removed alert to prevent blocking UI on error
    } finally {
      setIsLoading(false);
    }
  };

  const renderHome = () => (
    <div
      className="w-full h-full bg-[#FAF9F6] overflow-y-auto relative"
      style={{
        padding: "24px 20px",
        backgroundImage: setup.appBackground
          ? `url(${setup.appBackground})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div
        className="w-full h-[140px] rounded-b-[40px] bg-white absolute top-0 left-0 overflow-hidden shadow-sm"
        style={{
          backgroundImage: `url(${setup.osHeaderImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!setup.osHeaderImage && (
          <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
            HEADER
          </div>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-[#E6DDD8]"
      >
        <ArrowLeft size={24} className="text-[#3A3A3A]" />
      </button>

      <div className="mt-[140px] flex flex-col">
        {/* Search */}
        <div className="w-[70%] h-[60px] rounded-[30px] mx-auto mt-[40px] bg-white border border-[#E6DDD8] flex items-center px-6 shadow-sm">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-[#3A3A3A] text-lg"
          />
        </div>

        {/* Divider Decor */}
        <div
          className="w-full h-[40px] mt-6 overflow-hidden"
          style={{
            backgroundImage: `url(${setup.osDividerImage})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "repeat-x",
          }}
        >
          {!setup.osDividerImage && (
            <div className="w-full h-full border-b border-dashed border-[#E6DDD8]"></div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-y-[36px] gap-x-[28px] mt-[80px] mb-[200px]">
          {/* Roleplay App Icon */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => setActiveApp("roleplay")}
          >
            <div
              className="rounded-[28px] bg-white flex items-center justify-center shadow-md overflow-hidden border border-[#E6DDD8] transition-transform group-active:scale-95"
              style={{
                width: `${setup.osAppIconSize || 64}px`,
                height: `${setup.osAppIconSize || 64}px`,
                backgroundImage: setup.osAppIconBackgrounds?.["roleplay"]
                  ? `url(${setup.osAppIconBackgrounds["roleplay"]})`
                  : "none",
                backgroundSize: "cover",
              }}
            >
              {setup.osAppIcons?.["roleplay"] ? (
                <img
                  src={setup.osAppIcons["roleplay"]}
                  alt="Roleplay"
                  className="w-[80%] h-[80%] object-contain"
                />
              ) : (
                <div
                  className={`w-[80%] h-[80%] ${setup.osAppIconBackgrounds?.["roleplay"] ? "" : "bg-[#F3B4C2]"} rounded-2xl flex items-center justify-center text-white font-bold text-2xl`}
                >
                  {!setup.osAppIconBackgrounds?.["roleplay"] && "RP"}
                </div>
              )}
            </div>
            <span className="text-[16px] mt-[10px] text-[#3A3A3A] text-center font-medium">
              Roleplay
            </span>
          </div>

          {/* Instagram App Icon */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => setActiveApp("instagram")}
          >
            <div
              className="rounded-[28px] bg-white flex items-center justify-center shadow-md overflow-hidden border border-[#E6DDD8] transition-transform group-active:scale-95"
              style={{
                width: `${setup.osAppIconSize || 64}px`,
                height: `${setup.osAppIconSize || 64}px`,
                backgroundImage: setup.osAppIconBackgrounds?.["instagram"]
                  ? `url(${setup.osAppIconBackgrounds["instagram"]})`
                  : "none",
                backgroundSize: "cover",
              }}
            >
              {setup.osAppIcons?.["instagram"] ? (
                <img
                  src={setup.osAppIcons["instagram"]}
                  alt="Instagram"
                  className="w-[80%] h-[80%] object-contain"
                />
              ) : (
                <div
                  className={`w-[80%] h-[80%] ${setup.osAppIconBackgrounds?.["instagram"] ? "" : "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"} rounded-2xl flex items-center justify-center text-white font-bold text-2xl`}
                >
                  {!setup.osAppIconBackgrounds?.["instagram"] && "IG"}
                </div>
              )}
            </div>
            <span className="text-[16px] mt-[10px] text-[#3A3A3A] text-center font-medium">
              Instagram
            </span>
          </div>


        </div>
      </div>

      {/* Dock */}
      <div className="fixed bottom-[20px] left-[20px] right-[20px] h-[160px] rounded-[40px] bg-[#F3B4C2] flex justify-around items-center px-4 shadow-xl z-20">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[100px] h-[100px] rounded-[24px] bg-white shadow-sm overflow-hidden flex items-center justify-center border border-white/20"
          >
            {setup.osDockIcons?.[i] ? (
              <img
                src={setup.osDockIcons[i]}
                alt="Dock"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-[70%] h-[70%] bg-gray-100 rounded-xl"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRoleplayApp = () => {
    return (
      <div
        className="w-full h-full bg-white flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: setup.appBackground
            ? `url(${setup.appBackground})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Header with User Profile */}
        <div className="relative w-full h-[180px] bg-gray-200">
          <img
            src={profile.cover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <button
            onClick={() => setActiveApp("home")}
            className="absolute top-4 left-4 z-10 p-2 bg-black/30 backdrop-blur rounded-full text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="absolute -bottom-10 left-6 flex items-end gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
              <img
                src={profile.avatar}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-white drop-shadow-md">
                My Profile
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-12 flex-1 flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setRpTab("npcs")}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${rpTab === "npcs" ? "text-[#F3B4C2] border-b-2 border-[#F3B4C2]" : "text-gray-400"}`}
            >
              NPCs
            </button>
            <button
              onClick={() => setRpTab("main")}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${rpTab === "main" ? "text-[#F3B4C2] border-b-2 border-[#F3B4C2]" : "text-gray-400"}`}
            >
              Chat with {npc.name}
            </button>
          </div>

          <motion.div
            className="flex-1 flex overflow-hidden"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) setRpTab("main");
              if (info.offset.x > 50) setRpTab("npcs");
            }}
          >
            <AnimatePresence mode="wait">
              {rpTab === "npcs" ? (
                <motion.div
                  key="npcs"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  className="w-full flex flex-col"
                >
                  {/* Stories Section (Instagram Style) */}
                  <div className="py-4 px-4 border-b border-gray-100 overflow-x-auto flex gap-4 no-scrollbar">
                    {/* Add NPC Button */}
                    <div
                      className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
                      onClick={() => {
                        const name = prompt("Nhập tên NPC mới:");
                        if (name) {
                          const newNpc: NPC = {
                            id: Date.now().toString(),
                            name,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                            cover: "",
                            personality: "",
                            speechStyle: "",
                            bio: "",
                            lastMessage: "...",
                            time: new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                            badge: 0,
                            messages: [],
                            setup: { ...defaultSetup },
                          };
                          addNpc(newNpc);
                        }
                      }}
                    >
                      <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-[#F3B4C2] flex items-center justify-center text-[#F3B4C2]">
                        <Plus size={24} />
                      </div>
                      <span className="text-[10px] text-[#F3B4C2] font-bold">
                        Thêm NPC
                      </span>
                    </div>

                    {npcs.map((n) => (
                      <div
                        key={n.id}
                        className="flex flex-col items-center gap-1 min-w-[70px]"
                      >
                        <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                          <div className="p-[2px] bg-white rounded-full">
                            <div className="w-[56px] h-[56px] rounded-full overflow-hidden border border-gray-100">
                              <img
                                src={n.avatar}
                                alt={n.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-600 truncate w-full text-center">
                          {n.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* NPC List (Messenger Style) */}
                  <div className="flex-1 overflow-y-auto">
                    {npcs.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center px-4 h-[80px] hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setActiveChat(n);
                          setActiveApp("messenger");
                        }}
                      >
                        <div className="relative">
                          <div className="w-[56px] h-[56px] rounded-full overflow-hidden mr-3">
                            <img
                              src={n.avatar}
                              alt={n.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 right-3 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-50 h-full flex flex-col justify-center">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-[#3A3A3A] truncate">
                              {n.name}
                            </h3>
                            <span className="text-[10px] text-gray-400">
                              12:45 PM
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate pr-4">
                            {n.lastMessage ||
                              `Bắt đầu trò chuyện với ${n.name}...`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  className="w-full flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F3B4C2] mb-4 shadow-lg">
                    <img
                      src={npc.avatar}
                      alt={npc.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-[#3A3A3A] mb-2">
                    {npc.name}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-xs">
                    {npc.bio ||
                      "Đây là nhân vật chính của bạn. Hãy bắt đầu cuộc trò chuyện quan trọng nhất."}
                  </p>
                  <button
                    onClick={() => {
                      setActiveChat("main");
                      setActiveApp("messenger");
                    }}
                    className="px-10 py-4 bg-[#F3B4C2] text-white rounded-full font-bold shadow-xl hover:bg-[#F9C6D4] transition-all transform hover:scale-105"
                  >
                    Bắt đầu Roleplay
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderMessenger = () => {
    const targetNpc = activeChat === "main" ? npc : (activeChat as NPC);
    const chatName = targetNpc?.name;
    const chatAvatar = targetNpc?.avatar;
    const messages = targetNpc?.messages || [];

    return (
      <div
        className="w-full h-full bg-[#FAF9F6] flex flex-col relative"
        style={{
          backgroundImage: `url(${setup.appBackground})`,
          backgroundSize: "cover",
        }}
      >
        <div className="p-4 bg-white/90 backdrop-blur border-b border-[#E6DDD8] flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setActiveApp("roleplay")}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center">
              <img
                src={chatAvatar}
                alt={chatName}
                className="w-10 h-10 rounded-full mr-3 object-cover border border-[#E6DDD8]"
              />
              <div>
                <h2 className="font-bold text-[#3A3A3A]">{chatName}</h2>
                <p className="text-xs text-green-500">Đang hoạt động</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVideoCalling(true)}
            className="p-3 bg-[#F3B4C2] text-white rounded-full hover:bg-[#F9C6D4] shadow-md"
          >
            <Video size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10">
              Bắt đầu cuộc trò chuyện với {chatName}...
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[#F3B4C2] text-white rounded-tr-sm"
                      : "bg-white text-[#3A3A3A] border border-[#E6DDD8] rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-3 rounded-2xl bg-white text-[#3A3A3A] border border-[#E6DDD8] rounded-tl-sm">
                <p className="text-sm text-gray-400 italic">Đang gõ...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/90 backdrop-blur border-t border-[#E6DDD8]">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder="Nhắn tin..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              disabled={isLoading}
            />
            <button
              className={`font-bold ml-2 ${messageInput.trim() && !isLoading ? "text-[#F3B4C2]" : "text-gray-400"}`}
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isLoading}
            >
              Gửi
            </button>
          </div>
        </div>

        {/* Fake Video Call Overlay */}
        <AnimatePresence>
          {isVideoCalling && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-between py-12"
              style={{
                backgroundImage: `url(${chatAvatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: "overlay",
              }}
            >
              <div className="text-center mt-10">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {chatName}
                </h2>
                <p className="text-white/80">{formatTime(callDuration)}</p>
              </div>

              <div className="flex gap-8 mb-10">
                <button
                  onClick={endCall}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600"
                >
                  <PhoneOff size={32} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderInstagramApp = () => (
    <div
      className="w-full h-full bg-white flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: setup.appBackground
          ? `url(${setup.appBackground})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* IG Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveApp("home")}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-[#3A3A3A]" />
          </button>
          <h2 className="text-xl font-bold font-serif italic">Instagram</h2>
        </div>
        <div className="flex gap-4">
          <Search size={24} className="text-[#3A3A3A]" />
          <div className="w-6 h-6 rounded-md border-2 border-[#3A3A3A] flex items-center justify-center font-bold text-xs">
            +
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stories Section */}
        <div className="py-4 px-4 border-b border-gray-100 overflow-x-auto flex gap-4 no-scrollbar bg-white">
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            <div className="relative">
              <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-gray-200 p-[2px]">
                <img
                  src={profile.avatar}
                  alt="Me"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold">
                +
              </div>
            </div>
            <span className="text-[10px] text-gray-500">Tin của bạn</span>
          </div>
          {npcs.map((n) => (
            <div
              key={n.id}
              className="flex flex-col items-center gap-1 min-w-[70px]"
            >
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                <div className="p-[2px] bg-white rounded-full">
                  <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-gray-100">
                    <img
                      src={n.avatar}
                      alt={n.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-600 truncate w-full text-center">
                {n.name}
              </span>
            </div>
          ))}
        </div>

        {/* Fake IG Feed */}
        <div className="space-y-8 py-4">
          {npcs.slice(0, 3).map((n) => (
            <div key={n.id} className="space-y-3">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={n.avatar}
                      alt={n.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-sm">{n.name}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={n.avatar}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 space-y-2">
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 border-2 border-[#3A3A3A] rounded-full"></div>
                    <div className="w-6 h-6 border-2 border-[#3A3A3A] rounded-md"></div>
                    <div className="w-6 h-6 border-2 border-[#3A3A3A] rounded-lg"></div>
                  </div>
                  <div className="w-6 h-6 border-2 border-[#3A3A3A] rounded-sm"></div>
                </div>
                <p className="text-sm">
                  <span className="font-bold">{n.name}</span>{" "}
                  {n.bio || "Feeling cute today! ✨"}
                </p>
                <p className="text-xs text-gray-400 uppercase">2 HOURS AGO</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-md bg-white relative overflow-hidden shadow-2xl sm:rounded-[40px] sm:h-[90vh] sm:border-8 sm:border-gray-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeApp}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {activeApp === "home" && renderHome()}
            {activeApp === "roleplay" && renderRoleplayApp()}
            {activeApp === "instagram" && renderInstagramApp()}
            {activeApp === "messenger" && renderMessenger()}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
