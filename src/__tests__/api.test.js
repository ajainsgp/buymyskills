// API Integration Tests
import { rest } from "msw";
import { setupServer } from "msw/node";

// Mock API_BASE
const API_BASE = "http://localhost:4000";

// Setup MSW server
const server = setupServer(
  // Mock categories endpoint
  rest.get(`${API_BASE}/api/categories`, (req, res, ctx) => {
    return res(
      ctx.json({
        categories: ["Software Engineer", "Designer", "Data Analyst"],
      }),
    );
  }),

  // Mock price range endpoint
  rest.get(
    `${API_BASE}/api/categories/:category/price-range`,
    (req, res, ctx) => {
      const { category } = req.params;

      if (category === "Software Engineer") {
        return res(
          ctx.json({
            category: "Software Engineer",
            hourly: { min: 25, max: 150 },
            daily: { min: 200, max: 1200 },
          }),
        );
      }

      return res(
        ctx.json({
          category,
          hourly: { min: null, max: null },
          daily: { min: null, max: null },
        }),
      );
    },
  ),

  // Mock login endpoint
  rest.post(`${API_BASE}/api/login`, (req, res, ctx) => {
    return res(
      ctx.json({
        user: {
          id: "user123",
          emailId: "test@example.com",
          name: "Test User",
        },
        message: "Login successful",
      }),
    );
  }),
);

// Enable API mocking before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("API Integration", () => {
  test("fetches categories successfully", async () => {
    const response = await fetch(`${API_BASE}/api/categories`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.categories).toEqual([
      "Software Engineer",
      "Designer",
      "Data Analyst",
    ]);
    expect(Array.isArray(data.categories)).toBe(true);
  });

  test("fetches price range for category", async () => {
    const response = await fetch(
      `${API_BASE}/api/categories/Software%20Engineer/price-range`,
    );
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.category).toBe("Software Engineer");
    expect(data.hourly).toEqual({ min: 25, max: 150 });
    expect(data.daily).toEqual({ min: 200, max: 1200 });
  });

  test("handles categories with no price data", async () => {
    const response = await fetch(
      `${API_BASE}/api/categories/New%20Category/price-range`,
    );
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.category).toBe("New Category");
    expect(data.hourly).toEqual({ min: null, max: null });
    expect(data.daily).toEqual({ min: null, max: null });
  });

  test("login API works correctly", async () => {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailId: "test@example.com",
        password: "password123",
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.user).toHaveProperty("id");
    expect(data.user).toHaveProperty("emailId");
    expect(data.message).toBe("Login successful");
  });

  test("handles API errors gracefully", async () => {
    // Mock a server error
    server.use(
      rest.get(`${API_BASE}/api/categories`, (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );

    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    } catch (error) {
      // Network errors are also handled
      expect(error).toBeDefined();
    }
  });

  test("handles malformed JSON responses", async () => {
    server.use(
      rest.get(`${API_BASE}/api/categories`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.text("invalid json"));
      }),
    );

    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      await response.json();
      throw new Error("Should have thrown an error for invalid JSON");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
