/**
 * Playwright E2E Test Configuration
 * End-to-end testing for the hotel review generator
 */

module.exports = {
    testDir: './specs',
    timeout: 30000,
    retries: 1,
    workers: 1,
    reporter: [
        ['html'],
        ['line'],
        ['json', { outputFile: 'test-results.json' }]
    ],
    use: {
        baseURL: 'http://localhost:8080',
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 720 }
            }
        },
        {
            name: 'Mobile Safari',
            use: {
                browserName: 'webkit',
                viewport: { width: 390, height: 844 },
                isMobile: true
            }
        }
    ],
    webServer: {
        command: 'python3 -m http.server 8080',
        port: 8080,
        reuseExistingServer: true
    }
};