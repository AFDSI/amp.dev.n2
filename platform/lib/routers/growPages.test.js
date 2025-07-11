// platform/lib/routers/growPages.test.js

const {growPages} = require('./growPages'); // CORRECTED: Use destructuring for named export
const express = require('express');
const request = require('supertest');
// const fs = require('fs'); // Removed: 'fs' is not directly used, accessed via jest.requireActual

// Mock the fs module specifically for readFileSync of build-info.yaml
jest.mock('fs', () => ({
  ...jest.requireActual('fs'), // Import and retain default behavior
  readFileSync: jest.fn((path, encoding) => {
    if (path.includes('build-info.yaml')) {
      // Return mock content for build-info.yaml
      return `
        number: 123
        at: '2025-01-01T00:00:00.000Z'
        by: 'test-user'
        environment: 'test'
        commit:
          sha: 'mocksha123'
          message: 'mock commit'
      `;
    }
    // For all other files, use the actual readFileSync
    return jest.requireActual('fs').readFileSync(path, encoding);
  }),
}));

describe('growPages', () => {
  let app;

  beforeEach(() => {
    app = express();
    // Change this line to directly use the imported growPages module as the router
    app.use(growPages); // CORRECTED: Assumes growPages.js exports the router directly
  });

  // Test cases for growPages router
  it('serves a page', (done) => {
    request(app).get('/some/page.html').expect(200, done);
  });

  it('serves a localized page', (done) => {
    request(app).get('/de/some/page.html').expect(200, done);
  });

  it('serves a root page', (done) => {
    request(app).get('/').expect(200, done);
  });

  it('serves a root localized page', (done) => {
    request(app).get('/de/').expect(200, done);
  });

  it('serves a sitemap', (done) => {
    request(app).get('/sitemap.xml').expect(200, done);
  });

  it('serves a robots.txt', (done) => {
    request(app).get('/robots.txt').expect(200, done);
  });

  it('serves a favicon.ico', (done) => {
    request(app).get('/favicon.ico').expect(200, done);
  });
});
