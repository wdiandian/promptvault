import { atom } from 'nanostores';

export const $toast = atom<string | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string) {
  if (toastTimer) clearTimeout(toastTimer);
  $toast.set(message);
  toastTimer = setTimeout(() => $toast.set(null), 1800);
}
