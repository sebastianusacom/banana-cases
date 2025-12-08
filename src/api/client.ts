const API_URL = "https://tc2af9s735.execute-api.us-east-1.amazonaws.com";

export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  // Specific fields
  userId?: string;
  prizes?: any[];
  gameId?: string;
  roundId?: string;
  startTime?: number;
  nextRoundStartTime?: number;
  status?: string;
  crashPoint?: number;
  multiplier?: number;
  winnings?: number;
  bets?: any[];
}

export const api = {
  // Auth
  login: async (initData: string, userId: string) => {
    const res = await fetch(`${API_URL}/auth/telegram`, {
      method: "POST",
      body: JSON.stringify({ initData, userId }),
    });
    return res.json();
  },

  // User
  getUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/user?userId=${userId}`);
    return res.json();
  },

  // Cases
  openCase: async (userId: string, caseId: string, count: number) => {
    const res = await fetch(`${API_URL}/case/open`, {
      method: "POST",
      body: JSON.stringify({ userId, caseId, count }),
    });
    return res.json();
  },

  sellItem: async (userId: string, itemId: string) => {
    const res = await fetch(`${API_URL}/case/sell`, {
      method: "POST",
      body: JSON.stringify({ userId, itemId }),
    });
    return res.json();
  },

  // Crash Game
  getCrashState: async () => {
    const res = await fetch(`${API_URL}/crash/state`);
    return res.json();
  },

  placeBet: async (userId: string, betAmount: number, autoCashout?: number | null, username?: string, avatarUrl?: string) => {
    const res = await fetch(`${API_URL}/crash/bet`, {
      method: "POST",
      body: JSON.stringify({ userId, betAmount, autoCashout, username, avatarUrl }),
    });
    return res.json();
  },

  cashout: async (userId: string, roundId: string) => {
    const res = await fetch(`${API_URL}/crash/cashout`, {
      method: "POST",
      body: JSON.stringify({ userId, roundId }),
    });
    return res.json();
  },
};
