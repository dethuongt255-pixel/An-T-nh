import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, BookmarkPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Screen4: React.FC = () => {
  const { themeColor, apiSettings, updateApiSettings, apiPresets, addApiPreset, removeApiPreset, applyApiPreset, setIsSwipingDisabled } = useAppContext();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isManualModel, setIsManualModel] = useLocalStorage('rp_s4_isManualModel', false);
  
  // Preset state
  const [isSavingPreset, setIsSavingPreset] = useLocalStorage('rp_s4_isSavingPreset', false);
  const [presetName, setPresetName] = useLocalStorage('rp_s4_presetName', '');

  useEffect(() => {
    if (isSavingPreset) {
      setIsSwipingDisabled(true);
    } else {
      setIsSwipingDisabled(false);
    }
    return () => setIsSwipingDisabled(false);
  }, [isSavingPreset, setIsSwipingDisabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateApiSettings({ [name]: value });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    addApiPreset({
      id: Date.now().toString(),
      name: presetName.trim(),
      endpoint: apiSettings.endpoint,
      apiKey: apiSettings.apiKey,
      model: apiSettings.model
    });
    
    setPresetName('');
    setIsSavingPreset(false);
  };

  const fetchModels = async () => {
    if (!apiSettings.endpoint || !apiSettings.apiKey) {
      setFetchError('Vui lòng nhập Endpoint và API Key');
      return;
    }
    
    setIsFetching(true);
    setFetchError('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      // Assuming OpenAI compatible endpoint for models
      const baseUrl = apiSettings.endpoint.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiSettings.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        const models = data.data.map((m: any) => m.id).sort();
        setAvailableModels(models);
        setIsManualModel(false);
        if (models.length > 0 && !models.includes(apiSettings.model)) {
          updateApiSettings({ model: models[0] });
        }
        setFetchError('Lấy danh sách model thành công!');
        setTimeout(() => setFetchError(''), 3000);
      } else {
        throw new Error('Định dạng dữ liệu không hợp lệ từ Proxy');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setFetchError('Lỗi: Quá thời gian kết nối (Timeout). Vui lòng kiểm tra lại Proxy.');
      } else {
        setFetchError(`Lỗi: ${err.message || 'Không thể lấy danh sách model'}. Proxy có thể không hỗ trợ endpoint /models hoặc bị lỗi CORS.`);
      }
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-y-auto overflow-x-hidden shrink-0 snap-center pb-24"
      style={{ backgroundColor: themeColor }}
    >
      <div className="px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-gray-800" size={32} />
          <h2 className="text-3xl font-bold text-gray-800">Cài đặt API</h2>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Cấu hình API Proxy hoặc API chính thức. Mọi tính năng AI trong ứng dụng sẽ đi qua cấu hình này.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                API Endpoint (Proxy URL)
              </label>
              <input 
                type="text" 
                name="endpoint"
                placeholder="VD: https://api.openai.com/v1" 
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-sm"
                value={apiSettings.endpoint}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-2">Để trống sẽ dùng mặc định nếu có</p>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                API Key
              </label>
              <input 
                type="password" 
                name="apiKey"
                placeholder="sk-..." 
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-sm"
                value={apiSettings.apiKey}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={fetchModels}
                disabled={isFetching}
                className="w-full py-3 bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                <span>Gọi Model (Fetch Models)</span>
              </button>
              {fetchError && <p className="text-xs text-red-500 mt-2">{fetchError}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-base font-semibold text-gray-700">
                  Model (Chọn hoặc tự nhập)
                </label>
                {availableModels.length > 0 && (
                  <button 
                    onClick={() => setIsManualModel(!isManualModel)}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                  >
                    {isManualModel ? "Chọn từ danh sách" : "Nhập thủ công"}
                  </button>
                )}
              </div>
              
              {availableModels.length > 0 && !isManualModel ? (
                <select
                  name="model"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-sm"
                  value={apiSettings.model}
                  onChange={handleChange}
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="model"
                  placeholder="VD: gpt-4o, claude-3-opus..."
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-sm"
                  value={apiSettings.model}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Cấu hình đã lưu</h3>
              <button 
                onClick={() => setIsSavingPreset(!isSavingPreset)}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
              >
                <BookmarkPlus size={16} />
                <span>Lưu cấu hình hiện tại</span>
              </button>
            </div>

            {isSavingPreset && (
              <div className="mb-4 p-4 bg-pink-50 rounded-xl border border-pink-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Tên cấu hình (VD: OpenAI Chính, Proxy 1...)" 
                  className="flex-1 p-3 bg-white rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  autoFocus
                />
                <button 
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  Lưu
                </button>
              </div>
            )}

            <div className="space-y-3">
              {apiPresets.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có cấu hình nào được lưu</p>
              ) : (
                apiPresets.map(preset => {
                  const isActive = preset.endpoint === apiSettings.endpoint && 
                                   preset.apiKey === apiSettings.apiKey && 
                                   preset.model === apiSettings.model;
                  
                  return (
                    <div 
                      key={preset.id} 
                      className={`p-4 rounded-xl border ${isActive ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-white'} flex items-center justify-between transition-colors`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 truncate">{preset.name}</h4>
                          {isActive && <CheckCircle2 size={16} className="text-pink-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{preset.model}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button 
                            onClick={() => applyApiPreset(preset.id)}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Áp dụng
                          </button>
                        )}
                        <button 
                          onClick={() => removeApiPreset(preset.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Xóa cấu hình"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2">
              <Save size={20} />
              <span>Đã tự động lưu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
