import { create } from 'zustand';

interface UIState {
  sidebarWidth: number;
  isSidebarOpen: boolean;
  setSidebarWidth: (width: number) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarWidth: 256,
  isSidebarOpen: false,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
