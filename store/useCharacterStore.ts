import { create } from "zustand";

export type Character = {
  id: string;
  name: string;
  description: string;
  borderColor: string;
  gradientFrom: string;
};

type CharacterStore = {
  characters: Character[];
  addCharacter: (c: Character) => void;
  removeCharacter: (id: string) => void;
};

export const useCharacterStore = create<CharacterStore>((set) => ({
  characters: [
    { id: "1", name: "林默",   description: "性格冷静、谨慎、果断。人物关系：受沈雨晴委托调查失踪案件。",         borderColor: "border-yellow-500/60",  gradientFrom: "from-yellow-900/30" },
    { id: "2", name: "沈雨晴", description: "性格外表精致、内心复杂、冷静、善于伪装、可能带有隐藏目的。",         borderColor: "border-green-500/60",   gradientFrom: "from-green-900/30"  },
    { id: "3", name: "陈明",   description: "性格温和而儒雅、有好奇心、可能富有正义感。人物关系：林默的旧友。",   borderColor: "border-purple-500/60",  gradientFrom: "from-purple-900/30" },
    { id: "4", name: "豪尔",   description: "是一个嫉恶如仇、单纯的人。",                                         borderColor: "border-blue-500/60",    gradientFrom: "from-blue-900/30"   },
  ],

  addCharacter: (c) => set((s) => ({ characters: [...s.characters, c] })),
  removeCharacter: (id) => set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),
}));
