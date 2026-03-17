export interface Character {
  id: string;
  name: string;
  username: string;
  description: string;
  image: string;
  tags: string[];
  type?: 'bot' | 'user';
  profile?: string;
  personality?: string;
  firstMessage?: string;
  relationship?: string;
  advancedPrompt?: string;
  relatedNPCs?: string;
  unrelatedNPCs?: string;
  userProfile?: string;
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

export interface NovelCategory {
  id: string;
  name: string;
  tags: string[];
}

export interface NovelPrompt {
  id: string;
  content: string;
  depth: number;
}

export interface NovelCharacter {
  name: string;
  info: string;
}

export interface Novel {
  id: string;
  title: string;
  cover: string;
  background: string;
  categories: NovelCategory[];
  chapterLength: number;
  writingStyle: string;
  customStyle: string;
  prompts: NovelPrompt[];
  char1: NovelCharacter;
  char2: NovelCharacter;
  plot: string;
  content: string;
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
  novels: Novel[];
  addNovel: (novel: Novel) => void;
  updateNovel: (id: string, updates: Partial<Novel>) => void;
  deleteNovel: (id: string) => void;
  screen2Bg: string;
  setScreen2Bg: (bg: string) => void;
  isSwipingDisabled: boolean;
  setIsSwipingDisabled: (disabled: boolean) => void;
}

