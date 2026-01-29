import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: "info",
  visible: false,
  show: (message, type = "info") => set({ message, type, visible: true }),
  hide: () => set({ visible: false }),
}));
