import { Notify } from 'quasar';

export function useNotify() {
  function success(message: string): void {
    Notify.create({
      type: 'positive',
      progress: true,
      position: 'top-right',
      message,
    });
  }

  function error(message: string): void {
    Notify.create({
      type: 'negative',
      progress: true,
      position: 'top-right',
      message,
    });
  }

  function warning(message: string): void {
    Notify.create({
      type: 'warning',
      progress: true,
      position: 'top-right',
      message,
    });
  }

  return { success, error, warning };
}
