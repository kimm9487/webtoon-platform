import { create } from 'zustand';
import { Webtoon, Episode, User } from './types';

interface WebtoonStore {
  // 웹툰 관련
  webtoons: Webtoon[];
  selectedWebtoon: Webtoon | null;
  setWebtoons: (webtoons: Webtoon[]) => void;
  setSelectedWebtoon: (webtoon: Webtoon | null) => void;

  // 에피소드 관련
  episodes: Episode[];
  selectedEpisode: Episode | null;
  setEpisodes: (episodes: Episode[]) => void;
  setSelectedEpisode: (episode: Episode | null) => void;

  // 사용자 관련
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  // UI 상태
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useWebtoonStore = create<WebtoonStore>((set) => ({
  // 웹툰 초기 상태
  webtoons: [],
  selectedWebtoon: null,
  setWebtoons: (webtoons) => set({ webtoons }),
  setSelectedWebtoon: (webtoon) => set({ selectedWebtoon: webtoon }),

  // 에피소드 초기 상태
  episodes: [],
  selectedEpisode: null,
  setEpisodes: (episodes) => set({ episodes }),
  setSelectedEpisode: (episode) => set({ selectedEpisode: episode }),

  // 사용자 초기 상태
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user }),
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),

  // UI 초기 상태
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
