import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Character, AppItem, UserProfile, ApiSettings, ApiPreset } from './types';

const defaultContext: AppState = {
  themeColor: '#f7d7df',
  setThemeColor: () => {},
  characters: [],
  addCharacter: () => {},
  apps: [],
  addApp: () => {},
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
};

const AppContext = createContext<AppState>(defaultContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#f7d7df');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultContext.profile);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(defaultContext.apiSettings);
  const [apiPresets, setApiPresets] = useState<ApiPreset[]>([]);

  // Load from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('rp_themeColor');
    if (savedTheme) setThemeColor(savedTheme);

    const savedChars = localStorage.getItem('rp_characters');
    if (savedChars) setCharacters(JSON.parse(savedChars));

    const savedApps = localStorage.getItem('rp_apps');
    if (savedApps) setApps(JSON.parse(savedApps));

    const savedProfile = localStorage.getItem('rp_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedApiSettings = localStorage.getItem('rp_apiSettings');
    if (savedApiSettings) setApiSettings(JSON.parse(savedApiSettings));

    const savedApiPresets = localStorage.getItem('rp_apiPresets');
    if (savedApiPresets) setApiPresets(JSON.parse(savedApiPresets));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('rp_themeColor', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('rp_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('rp_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('rp_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('rp_apiSettings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  useEffect(() => {
    localStorage.setItem('rp_apiPresets', JSON.stringify(apiPresets));
  }, [apiPresets]);

  const addCharacter = (char: Character) => {
    setCharacters(prev => [char, ...prev]);
  };

  const addApp = (app: AppItem) => {
    setApps(prev => [app, ...prev]);
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

  return (
    <AppContext.Provider
      value={{
        themeColor,
        setThemeColor,
        characters,
        addCharacter,
        apps,
        addApp,
        profile,
        updateProfile,
        apiSettings,
        updateApiSettings,
        apiPresets,
        addApiPreset,
        removeApiPreset,
        applyApiPreset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
