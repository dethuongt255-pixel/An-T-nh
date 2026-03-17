import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Character, AppItem, UserProfile, ApiSettings, ApiPreset, Novel, NPC } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

const defaultContext: AppState = {
  themeColor: '#f7d7df',
  setThemeColor: () => {},
  characters: [],
  addCharacter: () => {},
  updateCharacter: () => {},
  deleteCharacter: () => {},
  apps: [],
  addApp: () => {},
  updateApp: () => {},
  deleteApp: () => {},
  profile: {
    avatar: 'https://i.pravatar.cc/150?img=32',
    cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop',
    background: '#FAF9F6',
  },
  updateProfile: () => {},
  apiSettings: {
    endpoint: '',
    apiKey: '',
    model: 'gpt-3.5-turbo',
  },
  updateApiSettings: () => {},
  apiPresets: [],
  addApiPreset: () => {},
  removeApiPreset: () => {},
  applyApiPreset: () => {},
  novels: [],
  addNovel: () => {},
  updateNovel: () => {},
  deleteNovel: () => {},
  npcs: [],
  addNpc: () => {},
  updateNpc: () => {},
  deleteNpc: () => {},
  screen2Bg: '',
  setScreen2Bg: () => {},
  isSwipingDisabled: false,
  setIsSwipingDisabled: () => {},
};

const AppContext = createContext<AppState>(defaultContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useLocalStorage('rp_themeColor', '#f7d7df');
  const [characters, setCharacters] = useLocalStorage<Character[]>('rp_characters', []);
  const [apps, setApps] = useLocalStorage<AppItem[]>('rp_apps', []);
  const [profile, setProfile] = useLocalStorage<UserProfile>('rp_profile', defaultContext.profile);
  const [apiSettings, setApiSettings] = useLocalStorage<ApiSettings>('rp_apiSettings', defaultContext.apiSettings);
  const [apiPresets, setApiPresets] = useLocalStorage<ApiPreset[]>('rp_apiPresets', []);
  const [novels, setNovels] = useLocalStorage<Novel[]>('rp_novels', []);
  const [npcs, setNpcs] = useLocalStorage<NPC[]>('rp_npcs', []);
  const [screen2Bg, setScreen2Bg] = useLocalStorage<string>('rp_screen2Bg', '');
  const [isSwipingDisabled, setIsSwipingDisabled] = useState(false);

  const addCharacter = (char: Character) => {
    setCharacters(prev => [char, ...prev]);
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const addApp = (app: AppItem) => {
    setApps(prev => [app, ...prev]);
  };

  const updateApp = (id: string, updates: Partial<AppItem>) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteApp = (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const updateApiSettings = (updates: Partial<ApiSettings>) => {
    setApiSettings(prev => ({ ...prev, ...updates }));
  };

  const addApiPreset = (preset: ApiPreset) => {
    setApiPresets(prev => [...prev, preset]);
  };

  const removeApiPreset = (id: string) => {
    setApiPresets(prev => prev.filter(p => p.id !== id));
  };

  const applyApiPreset = (id: string) => {
    const preset = apiPresets.find(p => p.id === id);
    if (preset) {
      setApiSettings({
        endpoint: preset.endpoint,
        apiKey: preset.apiKey,
        model: preset.model,
      });
    }
  };

  const addNovel = (novel: Novel) => {
    setNovels(prev => [novel, ...prev]);
  };

  const updateNovel = (id: string, updates: Partial<Novel>) => {
    setNovels(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNovel = (id: string) => {
    setNovels(prev => prev.filter(n => n.id !== id));
  };

  const addNpc = (npc: NPC) => {
    setNpcs(prev => [npc, ...prev]);
  };

  const updateNpc = (id: string, updates: Partial<NPC>) => {
    setNpcs(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNpc = (id: string) => {
    setNpcs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        themeColor,
        setThemeColor,
        characters,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        apps,
        addApp,
        updateApp,
        deleteApp,
        profile,
        updateProfile,
        apiSettings,
        updateApiSettings,
        apiPresets,
        addApiPreset,
        removeApiPreset,
        applyApiPreset,
        novels,
        addNovel,
        updateNovel,
        deleteNovel,
        npcs,
        addNpc,
        updateNpc,
        deleteNpc,
        screen2Bg,
        setScreen2Bg,
        isSwipingDisabled,
        setIsSwipingDisabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
