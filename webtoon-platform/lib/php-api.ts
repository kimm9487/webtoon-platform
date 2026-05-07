import { ApiResponse, Episode, Webtoon, User } from './types';

const PHP_API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000/api';

export interface AuthResult {
  token: string;
  user: User;
}

export interface CommentItem {
  id: string;
  userId: string;
  episodeId: string;
  content: string;
  likes: number;
  username: string;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorWebtoon extends Omit<Webtoon, 'author'> {
  author?: string;
  episodeCount: number;
}

export interface AuthorDashboard {
  author: {
    id: string;
    userId: string;
    name: string;
    bio?: string | null;
    profileImage?: string | null;
    followers: number;
    createdAt: string;
    updatedAt: string;
  };
  webtoons: AuthorWebtoon[];
  stats: {
    webtoonCount: number;
    episodeCount: number;
    views: number;
  };
}

export interface WebtoonPayload {
  title: string;
  description: string;
  thumbnail: string;
  genre: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
}

export interface EpisodePayload {
  episodeNumber: number;
  title: string;
  description: string;
  images: string[];
}

export interface UploadedFile {
  url: string;
  path: string;
  mime: string;
  size: number;
  originalName: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await fetch(`${PHP_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

async function uploadRequest(path: string, formData: FormData): Promise<ApiResponse<UploadedFile>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const response = await fetch(`${PHP_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload failed.');
  }

  return data;
}

export const authApi = {
  register: (payload: { email: string; username: string; password: string; role?: 'USER' | 'AUTHOR' }) =>
    request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<User>('/auth/me'),
};

export const commentApi = {
  getByEpisode: (episodeId: string) =>
    request<CommentItem[]>(`/comments?episodeId=${encodeURIComponent(episodeId)}`),

  create: (payload: { episodeId: string; content: string }) =>
    request<CommentItem>('/comments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, content: string) =>
    request<CommentItem>(`/comments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  delete: (id: string) =>
    request<void>(`/comments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

export const searchApi = {
  webtoons: (params: { q?: string; genre?: string; status?: string; limit?: number }) => {
    const search = new URLSearchParams();

    if (params.q) search.set('q', params.q);
    if (params.genre) search.set('genre', params.genre);
    if (params.status) search.set('status', params.status);
    if (params.limit) search.set('limit', String(params.limit));

    return request<Webtoon[]>(`/search?${search.toString()}`);
  },
};

export const authorApi = {
  dashboard: () => request<AuthorDashboard>('/author/dashboard'),

  uploadFile: (file: File, type: 'thumbnails' | 'episodes' | 'images' = 'images') => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadRequest(`/author/uploads?type=${encodeURIComponent(type)}`, formData);
  },

  createWebtoon: (payload: WebtoonPayload) =>
    request<AuthorWebtoon>('/author/webtoons', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWebtoon: (id: string, payload: WebtoonPayload) =>
    request<AuthorWebtoon>(`/author/webtoons/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteWebtoon: (id: string) =>
    request<void>(`/author/webtoons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createEpisode: (webtoonId: string, payload: EpisodePayload) =>
    request<Episode>(`/author/webtoons/${encodeURIComponent(webtoonId)}/episodes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEpisode: (id: string, payload: EpisodePayload) =>
    request<Episode>(`/author/episodes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteEpisode: (id: string) =>
    request<void>(`/author/episodes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
