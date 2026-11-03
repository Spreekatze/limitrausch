import type { RouteRecordRaw } from 'vue-router';

const routeAliases: Record<string, string> = {
  '/ereignisse': '/events',
  '/profil': '/profile',
  '/übersicht': '/dashboard',
  '/gilden': '/guilds',
  '/event-liste': '/event-list',
};

export function addRouteAliases(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.flatMap((route) => {
    const englishPath = routeAliases[route.path];

    if (!englishPath) {
      return [route];
    }

    return [
      {
        ...route,
        alias: [
          ...(Array.isArray(route.alias) ? route.alias : route.alias ? [route.alias] : []),
          englishPath,
        ],
      },
    ];
  });
}

export function getLocalizedPath(path: string, language: 'de' | 'en'): string {
  const entries = Object.entries(routeAliases);

  const matchingEntry = entries.find(([germanPath]) => {
    const pattern = new RegExp(`^${germanPath.replace(/:[^/]+/g, '[^/]+')}/?$`);

    return pattern.test(path);
  });

  if (!matchingEntry) {
    return path;
  }

  const [germanPath, englishPath] = matchingEntry;

  if (language === 'en') {
    return path.replace(
      new RegExp(`^${germanPath.replace(/:[^/]+/g, '([^/]+)')}/?$`),
      englishPath.replace(/:[^/]+/g, '$1'),
    );
  }

  return path.replace(
    new RegExp(`^${englishPath.replace(/:[^/]+/g, '([^/]+)')}/?$`),
    germanPath.replace(/:[^/]+/g, '$1'),
  );
}
