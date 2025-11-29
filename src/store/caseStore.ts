import { create } from 'zustand';
import { Prize } from './userStore';

export interface Case {
  id: string;
  name: string;
  image: string;
  price: number;
  items: Prize[];
}

interface CaseState {
  cases: Case[];
  getCaseById: (id: string) => Case | undefined;
}

const RARITY_COLORS = {
  common: '#b0c3d9',
  uncommon: '#5e98d9',
  rare: '#4b69ff',
  mythical: '#8847ff',
  legendary: '#d32ce6',
};

// Mock Data Generation
const generateItems = (count: number): Prize[] => {
  return Array.from({ length: count }).map((_, i) => {
    const rand = Math.random();
    let rarity: Prize['rarity'] = 'common';
    if (rand > 0.98) rarity = 'legendary';
    else if (rand > 0.9) rarity = 'mythical';
    else if (rand > 0.75) rarity = 'rare';
    else if (rand > 0.5) rarity = 'uncommon';

    return {
      id: `item-${i}-${Date.now()}`,
      name: `Banana Skin ${i + 1}`,
      rarity,
      image: 'https://placehold.co/200x200/png', // Placeholder
      value: Math.floor(Math.random() * 1000) + 10,
      color: RARITY_COLORS[rarity],
    };
  });
};

const mockCases: Case[] = [
  {
    id: 'case-1',
    name: 'Starter Case',
    image: 'https://placehold.co/300x300/png?text=Starter',
    price: 100,
    items: generateItems(20),
  },
  {
    id: 'case-2',
    name: 'Rare Case',
    image: 'https://placehold.co/300x300/png?text=Rare',
    price: 250,
    items: generateItems(20),
  },
  {
    id: 'case-3',
    name: 'Legendary Case',
    image: 'https://placehold.co/300x300/png?text=Legendary',
    price: 500,
    items: generateItems(20),
  },
];

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: mockCases,
  getCaseById: (id) => get().cases.find((c) => c.id === id),
}));

