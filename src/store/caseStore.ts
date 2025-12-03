import { create } from 'zustand';
import type { Prize } from './userStore';

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

export function pickWinner(items: Prize[]): Prize {
  const totalChance = items.reduce((sum, item) => sum + item.chance, 0);
  let rand = Math.random() * totalChance;
  
  for (const item of items) {
    rand -= item.chance;
    if (rand <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}

const STARTER_CASE_ITEMS: Prize[] = [
  {
    id: 'starter-banana-1',
    name: 'Nail Bracelet',
    image: 'https://i.postimg.cc/d3t4JyLw/Nail-Bracelet.png',
    lottie: 'https://lottie.host/embed/c0b0ec3b-8074-40c1-ad2d-8889614ebc75/vqhMisqWnu.lottie',
    value: 9400,
    chance: 25,
  },
  {
    id: 'starter-banana-2',
    name: 'Snoop Dogg',
    image: 'https://i.postimg.cc/2y82CZVY/Snoop-Dogg.png',
    lottie: 'https://lottie.host/embed/c0b0ec3b-8074-40c1-ad2d-8889614ebc75/vqhMisqWnu.lottie',
    value: 350,
    chance: 25,
  },
  {
    id: 'starter-banana-3',
    name: 'Diamond Ring',
    image: 'https://i.postimg.cc/ZnKVJdCk/Diamond-Ring.png',
    lottie: 'https://artboard-1.tiiny.site',
    value: 2000,
    chance: 25,
  },
  {
    id: 'starter-banana-4',
    name: 'Plush Pepe',
    image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
    lottie: 'https://lottie.host/embed/cc5d4bc9-4c10-4975-ab2f-2c744a310038/n5VPB1f5KF.lottie',
    value: 100000,
    chance: 25,
  },
];

const BALANCED_STARTER_ITEMS: Prize[] = [
  {
    id: 'starter-banana-1',
    name: 'Nail Bracelet',
    image: 'https://i.postimg.cc/d3t4JyLw/Nail-Bracelet.png',
    lottie: 'https://lottie.host/embed/c0b0ec3b-8074-40c1-ad2d-8889614ebc75/vqhMisqWnu.lottie',
    value: 9400,
    chance: 0.1,
  },
  {
    id: 'starter-banana-2',
    name: 'Snoop Dogg',
    image: 'https://i.postimg.cc/2y82CZVY/Snoop-Dogg.png',
    lottie: 'https://lottie.host/embed/c0b0ec3b-8074-40c1-ad2d-8889614ebc75/vqhMisqWnu.lottie',
    value: 350,
    chance: 20,
  },
  {
    id: 'starter-banana-3',
    name: 'Diamond Ring',
    image: 'https://i.postimg.cc/ZnKVJdCk/Diamond-Ring.png',
    lottie: 'https://artboard-1.tiiny.site',
    value: 2000,
    chance: 3,
  },
  {
    id: 'starter-banana-4',
    name: 'Plush Pepe',
    image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
    lottie: 'https://lottie.host/embed/cc5d4bc9-4c10-4975-ab2f-2c744a310038/n5VPB1f5KF.lottie',
    value: 100000,
    chance: 0,
  },
  {
    id: 'starter-banana-low',
    name: 'Stars',
    image: 'https://i.postimg.cc/wTnDKrcw/IMG-1701.png',
    value: 10,
    chance: 50,
  },
  {
    id: 'starter-banana-low2',
    name: 'Stars',
    image: 'https://i.postimg.cc/wTnDKrcw/IMG-1701.png',
    value: 250,
    chance: 5,
  },
];

const LEGENDARY_CASE_ITEMS: Prize[] = [
  {
    id: 'legendary-heart',
    name: 'Heart',
    image: 'https://i.postimg.cc/xCXZNbk1/Heart-Locket.png',
    value: 129326,
    chance: 0.4,
  },
  {
    id: 'legendary-peach',
    name: 'Peach',
    image: 'https://i.postimg.cc/DZSN4bWJ/Precious-Peach.png',
    value: 43082,
    chance: 0.6,
  },
  {
    id: 'legendary-arm',
    name: 'Arm',
    image: 'https://i.postimg.cc/W3dyqJD4/Mighty-Arm.png',
    value: 21899,
    chance: 1,
  },
  {
    id: 'legendary-shard',
    name: 'Shard',
    image: 'https://i.postimg.cc/Zq7gqLq4/Astral-Shard.png',
    value: 16115,
    chance: 2,
  },
  {
    id: 'legendary-nail-bracelet',
    name: 'Nail Bracelet',
    image: 'https://i.postimg.cc/nzXW9QsM/Nail-Bracelet.png',
    value: 12864,
    chance: 3.5,
  },
  {
    id: 'legendary-perfume-bottle',
    name: 'Perfume Bottle',
    image: 'https://i.postimg.cc/DZSN4bWW/Perfume-Bottle.png',
    value: 9350,
    chance: 4,
  },
  {
    id: 'legendary-brick',
    name: 'Brick',
    image: 'https://i.postimg.cc/YSnVSxSB/Artisan-Brick.png',
    value: 8596,
    chance: 4.5,
  },
  {
    id: 'legendary-poison',
    name: 'Poison',
    image: 'https://i.postimg.cc/765RJTC6/Magic-Potion.png',
    value: 7955,
    chance: 6,
  },
  {
    id: 'legendary-ring',
    name: 'Ring',
    image: 'https://i.postimg.cc/g0S50K0G/Bonded-Ring.png',
    value: 5772,
    chance: 25,
  },
  {
    id: 'legendary-lamp',
    name: 'Lamp',
    image: 'https://i.postimg.cc/YSnVSxSk/Genie-Lamp.png',
    value: 5343,
    chance: 25,
  },
];

const mockCases: Case[] = [
  {
    id: 'case-1',
    name: 'Starter Case',
    image: 'https://i.postimg.cc/2y82CZVY/Snoop-Dogg.png',
    price: 249,
    items: BALANCED_STARTER_ITEMS,
  },
  {
    id: 'case-2',
    name: 'Rare Case',
    image: 'https://i.postimg.cc/ZnKVJdCk/Diamond-Ring.png',
    price: 250,
    items: STARTER_CASE_ITEMS,
  },
  {
    id: 'case-3',
    name: 'Pepe Case',
    image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
    price: 9999,
    items: LEGENDARY_CASE_ITEMS,
  },
  {
    id: 'free-case',
    name: 'Free Case',
    image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
    price: 0,
    items: STARTER_CASE_ITEMS,
  },
  {
    id: 'case-4',
    name: 'Classic Starter Case',
    image: 'https://i.postimg.cc/d3t4JyLw/Nail-Bracelet.png',
    price: 150,
    items: STARTER_CASE_ITEMS,
  },
];

export const useCaseStore = create<CaseState>((_set, get) => ({
  cases: mockCases,
  getCaseById: (id) => get().cases.find((c) => c.id === id),
}));
