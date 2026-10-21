import { Notify } from 'quasar';

export function useNotify() {
  function success(message: string): void {
    Notify.create({
      type: 'positive',
      progress: true,
      message,
    });
  }

  function error(message: string): void {
    Notify.create({
      type: 'negative',
      progress: true,
      message,
    });
  }

  function warning(message: string): void {
    Notify.create({
      type: 'warning',
      progress: true,
      message,
    });
  }

  return { success, error, warning };
}
