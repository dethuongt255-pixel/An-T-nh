import React, { useState, useEffect } from "react";
import { X, Plus, Image as ImageIcon, Save } from "lucide-react";
import { CharacterSetup, CharacterEvent, NPC } from "../types";
import { useAppContext } from "../context";
import { compressImage } from "../utils/image";

interface Props {
  npc?: NPC;
  onClose: () => void;
  onSave: (
    setup: CharacterSetup,
    name: string,
    avatar: string,
    cover: string,
  ) => void;
}

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

export const CharacterSetupModal: React.FC<Props> = ({
  npc,
  onClose,
  onSave,
}) => {
  const { worldbooks } = useAppContext();
  const [setup, setSetup] = useState<CharacterSetup>(
    npc?.setup || { ...defaultSetup },
  );
  const [name, setName] = useState(npc?.name || "");
  const [avatar, setAvatar] = useState(npc?.avatar || "");
  const [cover, setCover] = useState(npc?.cover || "");

  const handleImageUpload = (
    field: keyof CharacterSetup | "avatar" | "cover",
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        compressImage(file, (base64) => {
          if (field === "avatar") {
            setAvatar(base64);
          } else if (field === "cover") {
            setCover(base64);
          } else {
            setSetup((prev) => ({ ...prev, [field]: base64 }));
          }
        });
      }
    };
    input.click();
  };

  const addEvent = () => {
    const newEvent: CharacterEvent = {
      id: Date.now().toString(),
      keywords: "",
      content: "",
      priority: "normal",
    };
    setSetup((prev) => ({ ...prev, events: [...prev.events, newEvent] }));
  };

  const updateEvent = (
    id: string,
    field: keyof CharacterEvent,
    value: string,
  ) => {
    setSetup((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const removeEvent = (id: string) => {
    setSetup((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const calculateTokens = () => {
    const text = JSON.stringify(setup);
    return Math.ceil(text.length / 4); // Rough estimate
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div
        className="bg-[#FAF9F6] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{
          backgroundImage: setup.appBackground
            ? `url(${setup.appBackground})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {setup.appBackground && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6DDD8] bg-[#F9C6D4] z-10">
          <h2 className="text-2xl font-bold text-white">Thiết Lập Nhân Vật</h2>
          <div className="flex gap-4">
            <button
              onClick={() => onSave(setup, name, avatar, cover)}
              className="p-2 bg-white rounded-full text-[#F3B4C2] hover:bg-gray-50"
            >
              <Save size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-full text-[#F3B4C2] hover:bg-gray-50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-8"
          style={{
            backgroundImage: `url(${setup.appBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleImageUpload("appBackground")}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:bg-white"
            >
              <ImageIcon size={16} /> Đổi nền App
            </button>
          </div>

          {/* Basic Info */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-4">
              Thông tin cơ bản
            </h3>
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#F3B4C2]"
                  onClick={() => handleImageUpload("avatar")}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" />
                  )}
                </div>
                <span className="text-xs text-gray-500">Avatar</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-40 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#F3B4C2]"
                  onClick={() => handleImageUpload("cover")}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" />
                  )}
                </div>
                <span className="text-xs text-gray-500">Ảnh bìa (Social)</span>
              </div>
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="Tên nhân vật"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] bg-white"
                />
                <select
                  value={setup.worldbookId || ""}
                  onChange={(e) =>
                    setSetup((prev) => ({
                      ...prev,
                      worldbookId: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] bg-white text-sm text-gray-700"
                >
                  <option value="">-- Chọn Sách Thế Giới (Tùy chọn) --</option>
                  {worldbooks.map((wb) => (
                    <option key={wb.id} value={wb.id}>
                      {wb.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Frame Template */}
          <div className="text-center font-mono text-sm text-[#F3B4C2] whitespace-pre-wrap select-none">
            {`⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚
      /)    /)
    (｡•ㅅ•｡)〝₎₎ Intro template! ✦₊ ˊ˗ 
. .╭∪─∪────────── ✦ ⁺.
. .┊ ◟﹫ 
. .┊﹒𐐪 
. .┊ꜝꜝ﹒
. .┊ ⨳゛
. .┊ ◟ヾ 
. .┊﹒𐐪 
. .┊ ◟﹫ 
   ╰─────────────  ✦ ⁺.
⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚`}
          </div>

          {/* Khung 1: Lịch sử cuộc đời */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Khung 1: Lịch sử cuộc đời
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Mọi thông tin về cuộc đời của nhân vật, viết bao nhiêu cũng được.
            </p>
            <textarea
              value={setup.history}
              onChange={(e) =>
                setSetup((prev) => ({ ...prev, history: e.target.value }))
              }
              className="w-full h-32 p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] resize-y"
              placeholder="Nhập lịch sử..."
            />
          </div>

          {/* Khung 2: Mối quan hệ lịch sử */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Khung 2: Mối quan hệ lịch sử với {"{{user}}"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Nếu chưa có mối quan hệ thì bỏ trống.
            </p>
            <textarea
              value={setup.relationship}
              onChange={(e) =>
                setSetup((prev) => ({ ...prev, relationship: e.target.value }))
              }
              className="w-full h-24 p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] resize-y"
              placeholder="Nhập mối quan hệ..."
            />
          </div>

          {/* Khung 3: Hệ thống trước và sau khi yêu */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Khung 3: Hệ thống trước khi yêu và sau khi yêu
            </h3>
            <textarea
              value={setup.systemBeforeAfterLove}
              onChange={(e) =>
                setSetup((prev) => ({
                  ...prev,
                  systemBeforeAfterLove: e.target.value,
                }))
              }
              className="w-full h-24 p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] resize-y"
              placeholder="Nhập hệ thống..."
            />
          </div>

          {/* Khung 4: Chế độ Tiểu Thuyết siêu dài */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#3A3A3A]">
                Khung 4: Chế Độ Tiểu Thuyết siêu dài
              </h3>
              <p className="text-xs text-gray-500">
                Số lượng ký tự cho mỗi câu trả lời
              </p>
            </div>
            <div className="flex items-center gap-4">
              {setup.longNovelMode && (
                <input
                  type="number"
                  value={setup.longNovelLength}
                  onChange={(e) =>
                    setSetup((prev) => ({
                      ...prev,
                      longNovelLength: parseInt(e.target.value) || 1000,
                    }))
                  }
                  className="w-24 p-2 rounded-lg border border-[#E6DDD8] text-center"
                />
              )}
              <button
                onClick={() =>
                  setSetup((prev) => ({
                    ...prev,
                    longNovelMode: !prev.longNovelMode,
                  }))
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${setup.longNovelMode ? "bg-[#F3B4C2]" : "bg-gray-300"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${setup.longNovelMode ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>

          {/* Khung 5: NSFW */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-red-500">
                  Khung 5: Quy tắc vượt ngưỡng An Toàn & NSFW
                </h3>
              </div>
              <button
                onClick={() =>
                  setSetup((prev) => ({
                    ...prev,
                    nsfwEnabled: !prev.nsfwEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${setup.nsfwEnabled ? "bg-red-500" : "bg-gray-300"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${setup.nsfwEnabled ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>
            {setup.nsfwEnabled && (
              <textarea
                value={setup.nsfwRules}
                onChange={(e) =>
                  setSetup((prev) => ({ ...prev, nsfwRules: e.target.value }))
                }
                className="w-full h-24 p-3 rounded-xl border border-red-200 focus:outline-none focus:border-red-500 resize-y bg-red-50"
                placeholder="Nhập lệnh hệ thống NSFW..."
              />
            )}
          </div>

          {/* Khung 6: Sự kiện quan trọng */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#3A3A3A]">
                Khung 6: Các sự kiện quan trọng
              </h3>
              <button
                onClick={addEvent}
                className="p-2 bg-[#F3B4C2] text-white rounded-full hover:bg-[#F9C6D4]"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Bot chỉ nhớ khi nhắc tới từ khóa. Phân tách từ khóa bằng dấu phẩy
              (,).
            </p>

            <div className="space-y-4">
              {setup.events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-[#E6DDD8] rounded-xl relative bg-white"
                >
                  <button
                    onClick={() => removeEvent(event.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Từ khóa (VD: sinh nhật, tai nạn)"
                      value={event.keywords}
                      onChange={(e) =>
                        updateEvent(event.id, "keywords", e.target.value)
                      }
                      className="p-2 rounded-lg border border-[#E6DDD8] text-sm"
                    />
                    <select
                      value={event.priority}
                      onChange={(e) =>
                        updateEvent(event.id, "priority", e.target.value)
                      }
                      className="p-2 rounded-lg border border-[#E6DDD8] text-sm"
                    >
                      <option value="high">Ưu tiên cao (Nhớ lâu)</option>
                      <option value="normal">Bình thường</option>
                      <option value="low">Ưu tiên thấp</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Nội dung sự kiện / Mốc thời gian..."
                    value={event.content}
                    onChange={(e) =>
                      updateEvent(event.id, "content", e.target.value)
                    }
                    className="w-full p-2 rounded-lg border border-[#E6DDD8] text-sm h-20 resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Khung 7: Thiết lập nâng cao */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Khung 7: Bộ thiết lập nâng cao (Roleplay)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Cách hành văn, lệnh gọi chi tiết. Quy tắc trong dấu () bot sẽ làm
              theo.
            </p>
            <textarea
              value={setup.advancedSetup}
              onChange={(e) =>
                setSetup((prev) => ({ ...prev, advancedSetup: e.target.value }))
              }
              className="w-full h-40 p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] resize-y font-mono text-sm"
              placeholder="(Ví dụ: Luôn xưng hô là 'anh' và gọi {{user}} là 'em'.)"
            />
          </div>

          {/* Khung 8: Cảnh mở đầu */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8]">
            <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">
              Khung 8: Cảnh mở đầu (Plot)
            </h3>
            <textarea
              value={setup.openingScene}
              onChange={(e) =>
                setSetup((prev) => ({ ...prev, openingScene: e.target.value }))
              }
              className="w-full h-24 p-3 rounded-xl border border-[#E6DDD8] focus:outline-none focus:border-[#F3B4C2] resize-y"
              placeholder="Cảnh mở đầu khi bắt đầu Roleplay..."
            />
          </div>

          {/* Khung 9: Token */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#3A3A3A]">
              Khung 9: Tổng hợp Token
            </h3>
            <div className="px-4 py-2 bg-[#F1ECEA] rounded-xl text-[#3A3A3A] font-mono font-bold">
              ~ {calculateTokens()} Tokens
            </div>
          </div>

          {/* Khung 11: Thiết lập phản hồi */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8] space-y-4">
            <h3 className="text-lg font-bold text-[#3A3A3A]">
              Khung 11: Thiết lập phản hồi
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Số ký tự tối đa
                </label>
                <input
                  type="number"
                  value={setup.maxTokens || 500}
                  onChange={(e) =>
                    setSetup((prev) => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-[#FAF9F6] border border-[#E6CFD2] rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3B4C2]"
                  placeholder="VD: 500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Số tin nhắn/lần
                </label>
                <input
                  type="number"
                  value={setup.messageCount || 1}
                  onChange={(e) =>
                    setSetup((prev) => ({
                      ...prev,
                      messageCount: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-[#FAF9F6] border border-[#E6CFD2] rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3B4C2]"
                  placeholder="VD: 1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              * Thiết lập này ảnh hưởng đến độ dài và số lượng phản hồi của Bot.
            </p>
          </div>

          {/* Khung 10: Tùy chỉnh OS */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-[#E6DDD8] space-y-6">
            <h3 className="text-lg font-bold text-[#3A3A3A]">
              Khung 10: Tùy chỉnh Màn hình OS
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Ảnh Header OS
                </span>
                <div
                  className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                  onClick={() => handleImageUpload("osHeaderImage")}
                >
                  {setup.osHeaderImage ? (
                    <img
                      src={setup.osHeaderImage}
                      alt="Header"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Ảnh Nền Toàn Bộ App
                </span>
                <div
                  className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                  onClick={() => handleImageUpload("appBackground")}
                >
                  {setup.appBackground ? (
                    <img
                      src={setup.appBackground}
                      alt="App BG"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">
                  Kích thước Icon App ({setup.osAppIconSize}px)
                </span>
                <input
                  type="range"
                  min="40"
                  max="120"
                  step="1"
                  value={setup.osAppIconSize || 64}
                  onChange={(e) =>
                    setSetup((prev) => ({
                      ...prev,
                      osAppIconSize: parseInt(e.target.value),
                    }))
                  }
                  className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F3B4C2]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Icon Dock (4 icon)
              </span>
              <div className="flex gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          compressImage(file, (base64) => {
                            const newIcons = [
                              ...(setup.osDockIcons || ["", "", "", ""]),
                            ];
                            newIcons[i] = base64;
                            setSetup((prev) => ({
                              ...prev,
                              osDockIcons: newIcons,
                            }));
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    {setup.osDockIcons?.[i] ? (
                      <img
                        src={setup.osDockIcons[i]}
                        alt={`Dock ${i}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-sm font-bold text-gray-700">
                  App Roleplay
                </span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIcons: {
                                  ...prev.osAppIcons,
                                  roleplay: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIcons?.["roleplay"] ? (
                        <img
                          src={setup.osAppIcons["roleplay"]}
                          alt="RP Icon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Nền Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIconBackgrounds: {
                                  ...prev.osAppIconBackgrounds,
                                  roleplay: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIconBackgrounds?.["roleplay"] ? (
                        <img
                          src={setup.osAppIconBackgrounds["roleplay"]}
                          alt="RP BG"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-bold text-gray-700">
                  App Instagram
                </span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIcons: {
                                  ...prev.osAppIcons,
                                  instagram: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIcons?.["instagram"] ? (
                        <img
                          src={setup.osAppIcons["instagram"]}
                          alt="IG Icon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Nền Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIconBackgrounds: {
                                  ...prev.osAppIconBackgrounds,
                                  instagram: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIconBackgrounds?.["instagram"] ? (
                        <img
                          src={setup.osAppIconBackgrounds["instagram"]}
                          alt="IG BG"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-sm font-bold text-gray-700">
                  App YouTube
                </span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIcons: {
                                  ...prev.osAppIcons,
                                  youtube: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIcons?.["youtube"] ? (
                        <img
                          src={setup.osAppIcons["youtube"]}
                          alt="YT Icon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">Nền Icon</span>
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#E6DDD8]"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            compressImage(file, (base64) => {
                              setSetup((prev) => ({
                                ...prev,
                                osAppIconBackgrounds: {
                                  ...prev.osAppIconBackgrounds,
                                  youtube: base64,
                                },
                              }));
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      {setup.osAppIconBackgrounds?.["youtube"] ? (
                        <img
                          src={setup.osAppIconBackgrounds["youtube"]}
                          alt="YT BG"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Preset / Sách Thế Giới */}
          <div className="bg-[#F9C6D4]/20 p-6 rounded-2xl shadow-sm border border-[#F3B4C2]">
            <h3 className="text-lg font-bold text-[#F3B4C2] mb-2">
              Sách Thế Giới (Prompt Preset)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ghi prompt lệnh giảm lượng Token. Gắn với nhân vật để API Proxy
              tuân theo.
            </p>
            <textarea
              value={setup.promptPreset}
              onChange={(e) =>
                setSetup((prev) => ({ ...prev, promptPreset: e.target.value }))
              }
              className="w-full h-32 p-3 rounded-xl border border-[#F3B4C2] focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] resize-y font-mono text-sm bg-white/80"
              placeholder="Định dạng gợi ý: [Character={{char}}, User={{user}}, Setting=...]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
