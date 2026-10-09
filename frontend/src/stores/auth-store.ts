import { beginDiscordLogin, getLoginStatus, logout } from '@/api/auth';
import { defineStore, acceptHMRUpdate } from 'pinia';
import type { DiscordOAuthUser } from '@limitrausch/contracts';

interface AuthState {
  loggedIn: boolean;
  discordUser: DiscordOAuthUser | null;
  isAdmin: boolean;
  loading: boolean;
}

let authPromise: Promise<void> | null = null;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    loggedIn: false,
    discordUser: null,
    isAdmin: false,
    loading: true,
  }),

  actions: {
    async fetchCurrentUser() {
      this.loading = true;
      try {
        const response = await getLoginStatus();
        this.loggedIn = response.loggedIn;
        this.discordUser = response.loggedIn ? response.user.discordInfo : null;
        this.isAdmin = response.loggedIn && response.user.isAdmin;
      } catch (error: unknown) {
        console.error(error);
        this.loggedIn = false;
        this.discordUser = null;
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
        this.discordUser = null;
        this.isAdmin = false;
      } catch (error: unknown) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
