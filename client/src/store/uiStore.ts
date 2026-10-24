import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface UiState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (type, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
