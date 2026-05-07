import axios from 'axios';
import { Webtoon, Episode, ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const webtoonApi = {
  getAll: async (): Promise<ApiResponse<Webtoon[]>> => {
    try {
      const response = await api.get('/webtoons');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch webtoons:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.get(`/webtoons/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch webtoon ${id}:`, error);
      throw error;
    }
  },

  create: async (webtoon: Omit<Webtoon, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.post('/webtoons', webtoon);
      return response.data;
    } catch (error) {
      console.error('Failed to create webtoon:', error);
      throw error;
    }
  },

  update: async (id: string, webtoon: Partial<Webtoon>): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.put(`/webtoons/${id}`, webtoon);
      return response.data;
    } catch (error) {
      console.error(`Failed to update webtoon ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/webtoons/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete webtoon ${id}:`, error);
      throw error;
    }
  },
};

export const episodeApi = {
  getByWebtoonId: async (webtoonId: string): Promise<ApiResponse<Episode[]>> => {
    try {
      const response = await api.get(`/episodes?webtoonId=${webtoonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch episodes for webtoon ${webtoonId}:`, error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.get(`/episodes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch episode ${id}:`, error);
      throw error;
    }
  },

  create: async (episode: Omit<Episode, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.post('/episodes', episode);
      return response.data;
    } catch (error) {
      console.error('Failed to create episode:', error);
      throw error;
    }
  },

  update: async (id: string, episode: Partial<Episode>): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.put(`/episodes/${id}`, episode);
      return response.data;
    } catch (error) {
      console.error(`Failed to update episode ${id}:`, error);
      throw error;
    }
  },

  setLike: async (id: string, liked: boolean): Promise<ApiResponse<Episode>> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await api.post(
        `/episodes/${id}/like`,
        { liked },
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update episode like ${id}:`, error);
      throw error;
    }
  },

  getLike: async (id: string): Promise<ApiResponse<{ liked: boolean }>> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await api.get(`/episodes/${id}/like`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch episode like ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/episodes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete episode ${id}:`, error);
      throw error;
    }
  },
};

export default api;
