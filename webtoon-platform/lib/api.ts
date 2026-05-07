import axios from 'axios';
import { Webtoon, Episode, ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * 웹툰 관련 API 함수들
 */
export const webtoonApi = {
  // 모든 웹툰 조회
  getAll: async (): Promise<ApiResponse<Webtoon[]>> => {
    try {
      const response = await api.get('/webtoons');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch webtoons:', error);
      throw error;
    }
  },

  // 특정 웹툰 조회
  getById: async (id: string): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.get(`/webtoons/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch webtoon ${id}:`, error);
      throw error;
    }
  },

  // 웹툰 생성 (관리자용)
  create: async (webtoon: Omit<Webtoon, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.post('/webtoons', webtoon);
      return response.data;
    } catch (error) {
      console.error('Failed to create webtoon:', error);
      throw error;
    }
  },

  // 웹툰 업데이트 (관리자용)
  update: async (id: string, webtoon: Partial<Webtoon>): Promise<ApiResponse<Webtoon>> => {
    try {
      const response = await api.put(`/webtoons/${id}`, webtoon);
      return response.data;
    } catch (error) {
      console.error(`Failed to update webtoon ${id}:`, error);
      throw error;
    }
  },

  // 웹툰 삭제 (관리자용)
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

/**
 * 에피소드 관련 API 함수들
 */
export const episodeApi = {
  // 특정 웹툰의 에피소드 조회
  getByWebtoonId: async (webtoonId: string): Promise<ApiResponse<Episode[]>> => {
    try {
      const response = await api.get(`/episodes?webtoonId=${webtoonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch episodes for webtoon ${webtoonId}:`, error);
      throw error;
    }
  },

  // 특정 에피소드 조회
  getById: async (id: string): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.get(`/episodes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch episode ${id}:`, error);
      throw error;
    }
  },

  // 에피소드 생성 (작가용)
  create: async (episode: Omit<Episode, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.post('/episodes', episode);
      return response.data;
    } catch (error) {
      console.error('Failed to create episode:', error);
      throw error;
    }
  },

  // 에피소드 업데이트 (작가용)
  update: async (id: string, episode: Partial<Episode>): Promise<ApiResponse<Episode>> => {
    try {
      const response = await api.put(`/episodes/${id}`, episode);
      return response.data;
    } catch (error) {
      console.error(`Failed to update episode ${id}:`, error);
      throw error;
    }
  },

  // 에피소드 삭제 (작가용)
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
