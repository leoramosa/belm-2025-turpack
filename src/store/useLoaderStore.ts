import { create } from "zustand";

interface LoaderState {
  isLoading: boolean;
  loadingText: string | null;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isLoading: false,
  loadingText: null,
  showLoader: (text?: string) =>
    set({ isLoading: true, loadingText: text || null }),
  hideLoader: () => set({ isLoading: false, loadingText: null }),
}));
