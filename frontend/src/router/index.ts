import { defineRouter } from '#q-app';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { addRouteAliases } from './route-locales';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes: addRouteAliases(routes),

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  //  TODO: Enable the beforeEach again, once you enable login via Toolbar
  // Router.beforeEach(async (to) => {
  //   if (to.path !== '/dashboard') {
  //     return true;
  //   }

  //   const authStore = useAuthStore();

  //   try {
  //     await authStore.initAuth();
  //   } catch (error) {
  //     console.error('Failed to check authentication:', error);
  //     return '/';
  //   }

  //   if (!authStore.loggedIn) {
  //     return '/';
  //   }

  //   return true;
  // });

  // enable HMR for it
  if (import.meta.hot) {
    handleHotUpdate(Router);
  }

  return Router;
});
