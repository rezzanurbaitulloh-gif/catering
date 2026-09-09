import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    actionTimeout: 20000,
    navigationTimeout: 90000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "customer",
      use: { ...devices["Desktop Chrome"], baseURL: process.env.CUST_BASE ?? "http://localhost:3000" },
    },
    {
      name: "customer-mobile",
      use: { ...devices["Pixel 5"], baseURL: process.env.CUST_BASE ?? "http://localhost:3000" },
    },
    {
      name: "admin",
      use: { ...devices["Desktop Chrome"], baseURL: process.env.ADMIN_BASE ?? "http://localhost:3001" },
    },
  ],
});
