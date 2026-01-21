import { toast } from "sonner";

type ToastOptions = {
  description?: string;
  duration?: number;
};

export function useToast() {
  return {
    success: (title: string, options?: ToastOptions) =>
      toast.success(title, {
        description: options?.description,
        duration: options?.duration ?? 3000,
      }),

    error: (title: string, options?: ToastOptions) =>
      toast.error(title, {
        description: options?.description,
        duration: options?.duration ?? 4000,
      }),

    warning: (title: string, options?: ToastOptions) =>
      toast(title, {
        description: options?.description,
        duration: options?.duration ?? 3500,
      }),

    info: (title: string, options?: ToastOptions) =>
      toast(title, {
        description: options?.description,
        duration: options?.duration ?? 3000,
      }),
  };
}
