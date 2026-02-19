// Enums (match Prisma schema)
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type AnswerType = "FREE_RESPONSE" | "MULTIPLE_CHOICE";

// These types match Prisma models but are defined here for use in client code
// without requiring Prisma client generation
export interface Player {
  id: string;
  sessionToken: string;
  firebaseUid: string | null;
  rating: number;
  ratingDeviation: number;
  gamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Problem {
  id: string;
  content: string;
  answer: string;
  answerType: AnswerType;
  choices: string[];
  rating: number;
  ratingDeviation: number;
  difficulty: Difficulty;
  source: string | null;
  sourceNumber: number | null;
  createdAt: Date;
}

export interface Attempt {
  id: string;
  playerId: string;
  problemId: string;
  answer: string;
  correct: boolean;
  ratingBefore: number;
  ratingAfter: number;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Player API
export interface PlayerResponse {
  id: string;
  sessionToken: string;
  rating: number;
  gamesPlayed: number;
  isAuthenticated: boolean;
}

// Problem API
export interface ProblemResponse {
  id: string;
  content: string;
  difficulty: Difficulty;
  answerType: AnswerType;
  choices: string[]; // empty for FREE_RESPONSE
  source: string | null;
  sourceNumber: number | null;
  problemRating: number;
  // Note: answer is NOT included (hidden from client)
}

// Attempt API
export interface AttemptRequest {
  problemId: string;
  answer: string;
}

export interface AttemptResponse {
  id: string;
  correct: boolean;
  correctAnswer: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

// Stats API
export interface StatsResponse {
  player: {
    rating: number;
    gamesPlayed: number;
    createdAt: string;
  };
  accuracy: {
    total: number;
    correct: number;
    percentage: number;
  };
  ratingHistory: Array<{
    rating: number;
    timestamp: string;
  }>;
  recentAttempts: Array<{
    problemContent: string;
    source: string | null;
    sourceNumber: number | null;
    correct: boolean;
    ratingChange: number;
    timestamp: string;
  }>;
}

// Session token header name
export const SESSION_TOKEN_HEADER = "x-session-token";
