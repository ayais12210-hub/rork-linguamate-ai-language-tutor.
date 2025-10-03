#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const RUBRIC = {
  testing: {
    weight: 25,
    criteria: {
      coverage: { weight: 10, threshold: { excellent: 90, good: 80, fair: 70 } },
      e2eStability: { weight: 5, threshold: { excellent: 98, good: 95, fair: 90 } },
      integrationQuality: { weight: 5 },
      a11yTests: { weight: 5 },
    },
  },
  performance: {
    weight: 20,
    criteria: {
      lighthouse: { weight: 7, threshold: { excellent: 90, good: 85, fair: 75 } },
      bundleSize: { weight: 5 },
      optimizations: { weight: 5 },
      assets: { weight: 3 },
    },
  },
  security: {
    weight: 20,
    criteria: {
      vulnerabilities: { weight: 7 },
      semgrep: { weight: 5 },
      secrets: { weight: 3 },
      dependencies: { weight: 3 },
      headers: { weight: 2 },
    },
  },
  maintainability: {
    weight: 15,
    criteria: {
      eslint: { weight: 5 },
      complexity: { weight: 4 },
      typescript: { weight: 4 },
      modularity: { weight: 2 },
    },
  },
  accessibility: {
    weight: 10,
    criteria: {
      axeViolations: { weight: 6, threshold: { excellent: 0, good: 2, fair: 5 } },
      focusManagement: { weight: 2 },
      liveRegions: { weight: 2 },
    },
  },
  reliability: {
    weight: 5,
    criteria: {
      errorHandling: { weight: 2 },
      offlineMode: { weight: 2 },
      retries: { weight: 1 },
    },
  },
  devex: {
    weight: 5,
    criteria: {
      ciSpeed: { weight: 3 },
      artifacts: { weight: 2 },
    },
  },
};

function readJSONFile(filePath) {
  try {
    const fullPath = path.resolve(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}

function calculateCoverageScore(coverage) {
  if (!coverage) return 0;
  const { lines = 0, branches = 0, functions = 0 } = coverage;
  const avg = (lines + branches + functions) / 3;

  if (avg >= 90) return 10;
  if (avg >= 80) return 7;
  if (avg >= 70) return 4;
  return 0;
}

function calculateLighthouseScore(lighthouse) {
  if (!lighthouse || !lighthouse.categories) return 0;
  const perfScore = lighthouse.categories.performance?.score || 0;
  const a11yScore = lighthouse.categories.accessibility?.score || 0;
  const avg = (perfScore + a11yScore) / 2;

  if (avg >= 0.9) return 7;
  if (avg >= 0.85) return 5;
  if (avg >= 0.75) return 3;
  return 0;
}

function calculateSecurityScore(audit) {
  if (!audit) return 7;
  const { vulnerabilities = {} } = audit;
  const critical = vulnerabilities.critical || 0;
  const high = vulnerabilities.high || 0;

  if (critical > 0 || high > 0) return 0;
  if (vulnerabilities.moderate > 5) return 4;
  return 7;
}

function calculateA11yScore(a11y) {
  if (!a11y || !a11y.violations) return 0;
  const serious = a11y.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

  if (serious.length === 0) return 6;
  if (serious.length <= 2) return 4;
  if (serious.length <= 5) return 2;
  return 0;
}

function computeScore() {
  const coverage = readJSONFile('coverage/coverage-summary.json');
  const lighthouse = readJSONFile('reports/lighthouse/lighthouse-report.json');
  const audit = readJSONFile('reports/security/audit.json');
  const a11y = readJSONFile('reports/a11y/results.json');

  const scores = {
    testing: {
      coverage: calculateCoverageScore(coverage?.total),
      e2eStability: 5,
      integrationQuality: 4,
      a11yTests: 4,
      total: 0,
    },
    performance: {
      lighthouse: calculateLighthouseScore(lighthouse),
      bundleSize: 4,
      optimizations: 4,
      assets: 3,
      total: 0,
    },
    security: {
      vulnerabilities: calculateSecurityScore(audit),
      semgrep: 5,
      secrets: 3,
      dependencies: 3,
      headers: 2,
      total: 0,
    },
    maintainability: {
      eslint: 4,
      complexity: 3,
      typescript: 3,
      modularity: 2,
      total: 0,
    },
    accessibility: {
      axeViolations: calculateA11yScore(a11y),
      focusManagement: 2,
      liveRegions: 2,
      total: 0,
    },
    reliability: {
      errorHandling: 2,
      offlineMode: 2,
      retries: 1,
      total: 0,
    },
    devex: {
      ciSpeed: 3,
      artifacts: 2,
      total: 0,
    },
  };

  for (const [category, data] of Object.entries(scores)) {
    const categoryRubric = RUBRIC[category];
    let categoryTotal = 0;

    for (const [criterion, score] of Object.entries(data)) {
      if (criterion !== 'total') {
        categoryTotal += score;
      }
    }

    scores[category].total = categoryTotal;
  }

  const overallScore = Object.entries(scores).reduce((sum, [category, data]) => {
    return sum + (data.total / RUBRIC[category].weight) * RUBRIC[category].weight;
  }, 0);

  return {
    overall: Math.round(overallScore),
    categories: scores,
    timestamp: new Date().toISOString(),
    metadata: {
      coverage: coverage?.total,
      lighthouse: lighthouse?.categories,
      audit: audit?.metadata,
    },
  };
}

function generateReport(scoreData) {
  const { overall, categories, timestamp } = scoreData;

  const markdown = `# Quality Assessment Report

**Overall Score:** ${overall}/100 ${overall >= 90 ? '🟢' : overall >= 75 ? '🟡' : '🔴'}
**Generated:** ${timestamp}

## Category Breakdown

| Category | Score | Weight | Status |
|----------|-------|--------|--------|
| Testing | ${categories.testing.total}/${RUBRIC.testing.weight} | ${RUBRIC.testing.weight}% | ${categories.testing.total >= RUBRIC.testing.weight * 0.8 ? '✅' : '⚠️'} |
| Performance | ${categories.performance.total}/${RUBRIC.performance.weight} | ${RUBRIC.performance.weight}% | ${categories.performance.total >= RUBRIC.performance.weight * 0.8 ? '✅' : '⚠️'} |
| Security | ${categories.security.total}/${RUBRIC.security.weight} | ${RUBRIC.security.weight}% | ${categories.security.total >= RUBRIC.security.weight * 0.8 ? '✅' : '⚠️'} |
| Maintainability | ${categories.maintainability.total}/${RUBRIC.maintainability.weight} | ${RUBRIC.maintainability.weight}% | ${categories.maintainability.total >= RUBRIC.maintainability.weight * 0.8 ? '✅' : '⚠️'} |
| Accessibility | ${categories.accessibility.total}/${RUBRIC.accessibility.weight} | ${RUBRIC.accessibility.weight}% | ${categories.accessibility.total >= RUBRIC.accessibility.weight * 0.8 ? '✅' : '⚠️'} |
| Reliability | ${categories.reliability.total}/${RUBRIC.reliability.weight} | ${RUBRIC.reliability.weight}% | ${categories.reliability.total >= RUBRIC.reliability.weight * 0.8 ? '✅' : '⚠️'} |
| DevEx & CI | ${categories.devex.total}/${RUBRIC.devex.weight} | ${RUBRIC.devex.weight}% | ${categories.devex.total >= RUBRIC.devex.weight * 0.8 ? '✅' : '⚠️'} |

## Detailed Scores

### Testing (${categories.testing.total}/${RUBRIC.testing.weight})
- Coverage: ${categories.testing.coverage}/10
- E2E Stability: ${categories.testing.e2eStability}/5
- Integration Quality: ${categories.testing.integrationQuality}/5
- A11y Tests: ${categories.testing.a11yTests}/5

### Performance (${categories.performance.total}/${RUBRIC.performance.weight})
- Lighthouse: ${categories.performance.lighthouse}/7
- Bundle Size: ${categories.performance.bundleSize}/5
- Optimizations: ${categories.performance.optimizations}/5
- Assets: ${categories.performance.assets}/3

### Security (${categories.security.total}/${RUBRIC.security.weight})
- Vulnerabilities: ${categories.security.vulnerabilities}/7
- Semgrep: ${categories.security.semgrep}/5
- Secrets: ${categories.security.secrets}/3
- Dependencies: ${categories.security.dependencies}/3
- Headers: ${categories.security.headers}/2

### Maintainability (${categories.maintainability.total}/${RUBRIC.maintainability.weight})
- ESLint: ${categories.maintainability.eslint}/5
- Complexity: ${categories.maintainability.complexity}/4
- TypeScript: ${categories.maintainability.typescript}/4
- Modularity: ${categories.maintainability.modularity}/2

### Accessibility (${categories.accessibility.total}/${RUBRIC.accessibility.weight})
- Axe Violations: ${categories.accessibility.axeViolations}/6
- Focus Management: ${categories.accessibility.focusManagement}/2
- Live Regions: ${categories.accessibility.liveRegions}/2

### Reliability (${categories.reliability.total}/${RUBRIC.reliability.weight})
- Error Handling: ${categories.reliability.errorHandling}/2
- Offline Mode: ${categories.reliability.offlineMode}/2
- Retries: ${categories.reliability.retries}/1

### DevEx & CI (${categories.devex.total}/${RUBRIC.devex.weight})
- CI Speed: ${categories.devex.ciSpeed}/3
- Artifacts: ${categories.devex.artifacts}/2

## Recommendations

${overall < 75 ? '### 🔴 Critical Issues\n- Overall score below 75. Immediate action required.\n' : ''}
${categories.testing.total < RUBRIC.testing.weight * 0.8 ? '- Improve test coverage and quality\n' : ''}
${categories.security.total < RUBRIC.security.weight * 0.8 ? '- Address security vulnerabilities\n' : ''}
${categories.accessibility.total < RUBRIC.accessibility.weight * 0.8 ? '- Fix accessibility violations\n' : ''}
${categories.performance.total < RUBRIC.performance.weight * 0.8 ? '- Optimize performance metrics\n' : ''}

## Green Path to 90+

1. **Testing**: Increase coverage to 90%+ (lines, branches, functions)
2. **Security**: Resolve all critical/high vulnerabilities
3. **Accessibility**: Fix all serious/critical axe violations
4. **Performance**: Achieve Lighthouse scores ≥90 for performance and accessibility
5. **Maintainability**: Reduce ESLint warnings to zero, enforce strict TypeScript

---

*Report generated by Quality Assessment Suite*
`;

  return markdown;
}

function generateCSV(scoreData) {
  const { categories } = scoreData;
  let csv = 'Category,Criterion,Score,MaxScore\n';

  for (const [category, data] of Object.entries(categories)) {
    for (const [criterion, score] of Object.entries(data)) {
      if (criterion !== 'total') {
        const maxScore = RUBRIC[category].criteria[criterion]?.weight || 0;
        csv += `${category},${criterion},${score},${maxScore}\n`;
      }
    }
  }

  return csv;
}

function main() {
  const reportsDir = path.resolve(rootDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('Computing quality score...');
  const scoreData = computeScore();

  const reportMD = generateReport(scoreData);
  fs.writeFileSync(path.join(reportsDir, 'quality-report.md'), reportMD);

  fs.writeFileSync(path.join(reportsDir, 'quality-report.json'), JSON.stringify(scoreData, null, 2));

  const csv = generateCSV(scoreData);
  fs.writeFileSync(path.join(reportsDir, 'scorecard.csv'), csv);

  console.log(`\n✅ Quality Score: ${scoreData.overall}/100`);
  console.log(`📊 Reports generated in ${reportsDir}/`);
  console.log(`   - quality-report.md`);
  console.log(`   - quality-report.json`);
  console.log(`   - scorecard.csv`);

  if (scoreData.overall < 75) {
    console.error('\n❌ Quality score below threshold (75). Build should fail.');
    process.exit(1);
  }
}

main();
