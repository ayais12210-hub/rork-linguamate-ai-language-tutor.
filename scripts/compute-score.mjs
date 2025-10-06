#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Quality scoring algorithm
function computeQualityScore() {
  const reports = {
    lint: { weight: 0.2, score: 0 },
    typecheck: { weight: 0.2, score: 0 },
    tests: { weight: 0.3, score: 0 },
    security: { weight: 0.15, score: 0 },
    e2e: { weight: 0.15, score: 0 }
  };

  // Check lint results
  try {
    const lintContent = fs.readFileSync('reports/lint.txt', 'utf8');
    const lintErrors = (lintContent.match(/\berror\b/gi) || []).length;
    const lintWarnings = (lintContent.match(/\bwarning\b/gi) || []).length;
    reports.lint.score = Math.max(0, 100 - (lintErrors * 10) - (lintWarnings * 2));
  } catch (e) {
    reports.lint.score = 50; // Default if file doesn't exist
  }

  // Check typecheck results
  try {
    const typecheckContent = fs.readFileSync('reports/typecheck.txt', 'utf8');
    const typeErrors = (typecheckContent.match(/error/g) || []).length;
    reports.typecheck.score = Math.max(0, 100 - (typeErrors * 15));
  } catch (e) {
    reports.typecheck.score = 50;
  }

  // Check test coverage
  try {
    const coveragePath = 'coverage/coverage-summary.json';
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      reports.tests.score = Math.round(
        (total.lines.pct + total.functions.pct + total.branches.pct + total.statements.pct) / 4
      );
    } else {
      reports.tests.score = 70; // Default if no coverage
    }
  } catch (e) {
    reports.tests.score = 70;
  }

  // Check security audit
  try {
    const securityPath = 'reports/security/audit.json';
    if (fs.existsSync(securityPath)) {
      const audit = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
      const vulnerabilities = audit.vulnerabilities || {};
      const high = vulnerabilities.high || 0;
      const moderate = vulnerabilities.moderate || 0;
      const low = vulnerabilities.low || 0;
      
      reports.security.score = Math.max(0, 100 - (high * 20) - (moderate * 10) - (low * 2));
    } else {
      reports.security.score = 85; // Default if no audit
    }
  } catch (e) {
    reports.security.score = 85;
  }

  // Check E2E results (from dedicated E2E JSON reporter)
  try {
    const e2ePath = 'reports/e2e/results.json';
    if (fs.existsSync(e2ePath)) {
      const e2eResults = JSON.parse(fs.readFileSync(e2ePath, 'utf8'));
      // Assume e2eResults has a 'tests' array with 'status' field ('passed', 'failed', etc.)
      const tests = Array.isArray(e2eResults.tests) ? e2eResults.tests : [];
      const total = tests.length;
      const passed = tests.filter(t => t.status === 'passed').length;
      reports.e2e.score = total > 0 ? Math.round((passed / total) * 100) : 80;
    } else {
      reports.e2e.score = 80; // Default if no E2E results
    }
  } catch (e) {
    reports.e2e.score = 80;
  }

  // Calculate weighted overall score
  const overall = Object.values(reports).reduce((sum, report) => {
    return sum + (report.score * report.weight);
  }, 0);

  return {
    overall: Math.round(overall),
    breakdown: reports,
    timestamp: new Date().toISOString()
  };
}

// Generate quality report
function generateReport(score) {
  const report = {
    ...score,
    summary: {
      status: score.overall >= 90 ? 'excellent' : score.overall >= 75 ? 'good' : 'needs-improvement',
      recommendations: []
    }
  };

  // Add recommendations based on scores
  if (score.breakdown.lint.score < 80) {
    report.summary.recommendations.push('Fix linting issues to improve code quality');
  }
  if (score.breakdown.typecheck.score < 90) {
    report.summary.recommendations.push('Resolve TypeScript errors for better type safety');
  }
  if (score.breakdown.tests.score < 80) {
    report.summary.recommendations.push('Increase test coverage to improve reliability');
  }
  if (score.breakdown.security.score < 85) {
    report.summary.recommendations.push('Address security vulnerabilities');
  }
  if (score.breakdown.a11y.score < 80) {
    report.summary.recommendations.push('Fix failing accessibility tests');
  }

  return report;
}

// Main execution
try {
  const score = computeQualityScore();
  const report = generateReport(score);
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write JSON report
  fs.writeFileSync('reports/quality-report.json', JSON.stringify(report, null, 2));
  
  // Write markdown report
  const markdown = `# Quality Assessment Report

**Overall Score:** ${report.overall}/100 ${report.overall >= 90 ? '🟢' : report.overall >= 75 ? '🟡' : '🔴'}

## Breakdown

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Linting | ${report.breakdown.lint.score}/100 | ${report.breakdown.lint.weight * 100}% | ${Math.round(report.breakdown.lint.score * report.breakdown.lint.weight)} |
| TypeScript | ${report.breakdown.typecheck.score}/100 | ${report.breakdown.typecheck.weight * 100}% | ${Math.round(report.breakdown.typecheck.score * report.breakdown.typecheck.weight)} |
| Tests | ${report.breakdown.tests.score}/100 | ${report.breakdown.tests.weight * 100}% | ${Math.round(report.breakdown.tests.score * report.breakdown.tests.weight)} |
| Security | ${report.breakdown.security.score}/100 | ${report.breakdown.security.weight * 100}% | ${Math.round(report.breakdown.security.score * report.breakdown.security.weight)} |
| E2E | ${report.breakdown.e2e.score}/100 | ${report.breakdown.e2e.weight * 100}% | ${Math.round(report.breakdown.e2e.score * report.breakdown.e2e.weight)} |

## Recommendations

${report.summary.recommendations.length > 0 
  ? report.summary.recommendations.map(rec => `- ${rec}`).join('\n')
  : '- All quality metrics are within acceptable ranges'}

---
*Generated on ${report.timestamp}*
`;

  fs.writeFileSync('reports/quality-report.md', markdown);
  
  console.log(`Quality Score: ${report.overall}/100`);
  console.log(`Status: ${report.summary.status}`);
  
  if (report.summary.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  // Enforce quality gate
  const threshold = process.env.QUALITY_THRESHOLD
    ? Number(process.env.QUALITY_THRESHOLD)
    : 75;
  if (report.overall < threshold) {
    console.error(
      `\n❌ Quality score ${report.overall} is below the threshold (${threshold}). Failing the process.`
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Error computing quality score:', error);
  process.exit(1);
}