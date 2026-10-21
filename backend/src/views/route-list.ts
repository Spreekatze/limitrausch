interface BackendRoute {
  method: "GET" | "POST";
  path: string;
  description: string;
}

const routes: BackendRoute[] = [
  { method: "GET", path: "/", description: "Backend route overview" },
  {
    method: "GET",
    path: "/assets/styles.css",
    description: "Backend page stylesheet",
  },
  {
    method: "GET",
    path: "/status/health",
    description: "Backend health status",
  },
  // { method: "POST", path: "/playground/login", description: "Mock login" },
  {
    method: "GET",
    path: "/auth/discord",
    description: "Start Discord OAuth",
  },
  {
    method: "GET",
    path: "/auth/discord/callback",
    description: "Discord OAuth callback",
  },
  {
    method: "GET",
    path: "/raid-helper/events",
    description: "List Raid Helper events",
  },
];

export function renderRouteRows(): string {
  return routes
    .map(
      ({ method, path, description }) => `
        <tr>
          <td><span class="method method-${method.toLowerCase()}">${method}</span></td>
          <td><code>${path}</code></td>
          <td>${description}</td>
        </tr>`,
    )
    .join("");
}
