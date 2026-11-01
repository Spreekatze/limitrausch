import { beginDiscordLogin, getLoginStatus, logout } from '@/api/auth';
import { useNotify } from '@/composable/useNotify';
import { getUserErrorMessage } from '@/utils/error-messages';
import type { AuthUser } from '@limitrausch/contracts';
import { defineStore, acceptHMRUpdate } from 'pinia';

interface AuthState {
  loggedIn: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
}

let authPromise: Promise<void> | null = null;
const notify = useNotify();

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    loggedIn: false,
    user: null,
    isAdmin: false,
    loading: true,
  }),

  actions: {
    async fetchCurrentUser() {
      this.loading = true;
      try {
        const response = await getLoginStatus();
        this.loggedIn = response.loggedIn;
        this.user = response.loggedIn ? response.user : null;
      } catch (error: unknown) {
        console.error(error);
        notify.error(getUserErrorMessage(error));
        this.loggedIn = false;
        this.user = null;
        this.isAdmin = false;
      } finally {
        this.loading = false;
      }
    },

    async initAuth() {
      if (!this.loading) {
        return;
      }

      if (!authPromise) {
        authPromise = this.fetchCurrentUser().finally(() => {
          authPromise = null;
        });
      }

      await authPromise;
    },

    loginUser() {
      this.loading = true;
      beginDiscordLogin();
    },
    async logoutCurrentUser() {
      this.loading = true;
      try {
        await logout();
        this.loggedIn = false;
        this.user = null;
        this.isAdmin = false;
      } catch (error: unknown) {
        console.error(error);
        notify.error(getUserErrorMessage(error));
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
