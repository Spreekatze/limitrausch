import { describe, expect, it } from "vitest";
import { renderRouteRows } from "../route-list.js";

describe("renderRouteRows", () => {
  it("renders each documented route with its method, path and description", () => {
    const rows = renderRouteRows();

    expect(rows).toContain('<span class="method method-get">GET</span>');
    expect(rows).toContain("<code>/status/health</code>");
    expect(rows).toContain("Start Discord OAuth");
    expect(rows).toContain("<tr>");
  });
});
