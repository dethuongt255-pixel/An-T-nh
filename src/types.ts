export interface Character {
  id: string;
  name: string;
  username: string;
  description: string;
  image: string;
  tags: string[];
}

export interface AppItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  time: string;
  badge: number;
}

export interface UserProfile {
  avatar: string;
  cover: string;
  background: string;
}

export interface ApiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface ApiPreset {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface AppState {
  themeColor: string;
  setThemeColor: (color: string) => void;
  characters: Character[];
  addCharacter: (char: Character) => void;
  apps: AppItem[];
  addApp: (app: AppItem) => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  apiSettings: ApiSettings;
  updateApiSettings: (settings: Partial<ApiSettings>) => void;
  apiPresets: ApiPreset[];
  addApiPreset: (preset: ApiPreset) => void;
  removeApiPreset: (id: string) => void;
  applyApiPreset: (id: string) => void;
}

