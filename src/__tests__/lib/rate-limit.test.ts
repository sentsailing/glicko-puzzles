import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function createMockRequest(ip: string = "127.0.0.1", path: string = "/api/test"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("Rate Limiter", () => {
  it("allows requests within limit", () => {
    const req = createMockRequest("10.0.0.1", "/api/rate-test-1");
    const result = checkRateLimit(req, { limit: 5 });
    expect(result).toBeNull();
  });

  it("blocks requests exceeding limit", () => {
    const ip = "10.0.0.2";
    const path = "/api/rate-test-2";

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      const req = createMockRequest(ip, path);
      checkRateLimit(req, { limit: 3 });
    }

    // Next request should be blocked
    const req = createMockRequest(ip, path);
    const result = checkRateLimit(req, { limit: 3 });
    expect(result).not.toBeNull();
    // Verify 429 status
    expect(result!.status).toBe(429);
  });

  it("tracks different IPs separately", () => {
    const path = "/api/rate-test-3";

    // Exhaust limit for IP 1
    for (let i = 0; i < 3; i++) {
      checkRateLimit(createMockRequest("10.0.0.3", path), { limit: 3 });
    }

    // IP 2 should still be allowed
    const result = checkRateLimit(createMockRequest("10.0.0.4", path), { limit: 3 });
    expect(result).toBeNull();
  });

  it("tracks different paths separately", () => {
    const ip = "10.0.0.5";

    // Exhaust limit for path 1
    for (let i = 0; i < 3; i++) {
      checkRateLimit(createMockRequest(ip, "/api/rate-test-4a"), { limit: 3 });
    }

    // Path 2 should still be allowed
    const result = checkRateLimit(createMockRequest(ip, "/api/rate-test-4b"), { limit: 3 });
    expect(result).toBeNull();
  });
});
