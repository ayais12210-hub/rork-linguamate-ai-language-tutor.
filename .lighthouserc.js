module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8081/',
        'http://localhost:8081/onboarding',
        'http://localhost:8081/translator',
        'http://localhost:8081/learn',
        'http://localhost:8081/lessons',
        'http://localhost:8081/profile',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.80 }],
        'categories:pwa': ['warn', { minScore: 0.70 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
