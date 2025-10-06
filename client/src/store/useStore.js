import { create } from 'zustand';

const useStore = create((set) => ({
  // Settings
  settings: {
    isLayoutHorizontal: true,
    splitterPercentage: 50,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  // Session
  session: {},
  updateSession: (newSession) =>
    set((state) => ({
      session: { ...state.session, ...newSession },
    })),
}));

export default useStore;
