export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  rating: number; // 0-5 (0.5 단위)
  reviewer: string; // '익평삼' or user name
  reviewText?: string;
  genre?: string;
  youtubeUrl?: string;
  coverUrl?: string;
  createdAt: string;
  isOfficial: boolean; // true = 익평삼 review, false = user review
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
