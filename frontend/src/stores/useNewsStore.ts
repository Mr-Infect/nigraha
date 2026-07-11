import { create } from 'zustand';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  published: string;
  source: string;
  summary?: string;
}

interface NewsState {
  news: NewsItem[];
  setNews: (items: NewsItem[]) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  news: [],
  setNews: (items) => set({ news: items }),
}));
