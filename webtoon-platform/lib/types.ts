/**
 * 웹툰 플랫폼의 기본 타입 정의
 */

export interface Webtoon {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  genre: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  webtoonId: string;
  episodeNumber: number;
  title: string;
  description: string;
  images: string[];
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  profileImage: string;
  followers: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  role?: 'USER' | 'AUTHOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  episodeId: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
