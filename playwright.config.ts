import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
    testDir: "e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [["list"]],
    timeout: 180_000,
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "off",
        ...devices["Desktop Chrome"],
    },
    projects: [{ name: "chromium", use: {} }],
    webServer: {
        command: "npm run dev -- -p 3000",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
