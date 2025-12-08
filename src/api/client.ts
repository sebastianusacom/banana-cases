const API_URL = "https://tc2af9s735.execute-api.us-east-1.amazonaws.com";

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  // Specific fields
  userId?: string;
  prizes?: any[];
  gameId?: string;
  startTime?: number;
  status?: string;
  crashPoint?: number;
  multiplier?: number;
  winnings?: number;
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

  // Crash Game
  placeBet: async (userId: string, betAmount: number) => {
    const res = await fetch(`${API_URL}/crash/bet`, {
      method: "POST",
      body: JSON.stringify({ userId, betAmount }),
    });
    return res.json();
  },

  cashout: async (userId: string, gameId: string) => {
    const res = await fetch(`${API_URL}/crash/cashout`, {
      method: "POST",
      body: JSON.stringify({ userId, gameId }),
    });
    return res.json();
  },
};
