export interface MemberRating {
  memberId: string; // "1" | "2" | "3"
  rating: number;
  comment?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  rating: number; // 0-5 (0.5 단위) - 익평삼 평균
  memberRatings?: MemberRating[]; // 개별 출연자 평점
  reviewer: string; // '익평삼' or user name
  reviewText?: string;
  genre?: string;
  youtubeUrl?: string;
  coverUrl?: string;
  createdAt: string;
  isOfficial: boolean; // true = 익평삼 review, false = user review
  subscriberRating?: number; // 구독자 평균 평점
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
