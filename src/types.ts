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
  // New fields for the character OS
  socialProfile?: SocialProfile;
  socialPosts?: SocialPost[];
  chatMessages?: { role: 'user' | 'assistant' | 'system', content: string }[];
  chatSettings?: ChatSettings;
  memory?: string;
  tokenCount?: number;
}

export interface SocialProfile {
  cover: string;
  username: string;
  bio: string;
  location: string;
  joinedDate: string;
  followers: number;
  following: number;
}

export interface SocialPost {
  id: string;
  content: string;
  time: string;
  likes: number;
  comments: SocialComment[];
}

export interface SocialComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
}

export interface ChatSettings {
  background: string;
  offlineLength: number;
  onlineLength: number;
  memoryMessageCount: number;
  memoryTokenCount: number;
}

export interface AppItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  time: string;
  badge: number;
  functions?: string;
  content?: string;
  messages?: { role: 'user' | 'assistant', content: string }[];
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

export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  background?: string;
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
  chapters: Chapter[];
  memoryLimit: number;
}

export interface CharacterEvent {
  id: string;
  keywords: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
}

export interface Worldbook {
  id: string;
  title: string;
  content: string;
}

export interface CharacterSetup {
  promptPreset: string;
  worldbookId?: string;
  history: string;
  relationship: string;
  systemBeforeAfterLove: string;
  longNovelMode: boolean;
  longNovelLength: number;
  nsfwEnabled: boolean;
  nsfwRules: string;
  events: CharacterEvent[];
  advancedSetup: string;
  openingScene: string;
  appBackground: string;
  osHeaderImage: string;
  osDividerImage: string;
  osDockIcons: string[];
  osAppIcons: Record<string, string>;
  osAppIconBackgrounds: Record<string, string>;
  osAppIconSize: number;
}

export interface NPC {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  personality: string;
  speechStyle: string;
  bio: string;
  lastMessage: string;
  time: string;
  badge: number;
  apps?: AppItem[];
  setup?: CharacterSetup;
  messages?: { role: 'user' | 'assistant' | 'system', content: string }[];
}

export interface AppState {
  themeColor: string;
  setThemeColor: (color: string) => void;
  characters: Character[];
  addCharacter: (char: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  apps: AppItem[];
  addApp: (app: AppItem) => void;
  updateApp: (id: string, updates: Partial<AppItem>) => void;
  deleteApp: (id: string) => void;
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
  npcs: NPC[];
  addNpc: (npc: NPC) => void;
  updateNpc: (id: string, updates: Partial<NPC>) => void;
  deleteNpc: (id: string) => void;
  screen2Bg: string;
  setScreen2Bg: (bg: string) => void;
  isSwipingDisabled: boolean;
  setIsSwipingDisabled: (disabled: boolean) => void;
  worldbooks: Worldbook[];
  addWorldbook: (wb: Worldbook) => void;
  updateWorldbook: (id: string, updates: Partial<Worldbook>) => void;
  deleteWorldbook: (id: string) => void;
  worldbookBg: string;
  setWorldbookBg: (bg: string) => void;
}

