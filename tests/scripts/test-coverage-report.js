#!/usr/bin/env node

/**
 * Test Coverage Report Generator
 * 
 * This script generates comprehensive test coverage reports and provides
 * recommendations for improving test coverage.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COVERAGE_DIR = 'coverage';
const COVERAGE_JSON = path.join(COVERAGE_DIR, 'coverage-final.json');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function generateCoverageReport() {
  console.log(colorize('\n🧪 Generating Test Coverage Report\n', 'cyan'));

  try {
    // Run tests with coverage
    console.log(colorize('Running tests with coverage...', 'blue'));
    execSync('pnpm test:coverage', { stdio: 'inherit' });

    // Check if coverage file exists
    if (!fs.existsSync(COVERAGE_JSON)) {
      console.error(colorize('❌ Coverage file not found. Make sure tests ran successfully.', 'red'));
      process.exit(1);
    }

    // Read coverage data
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_JSON, 'utf8'));
    
    // Analyze coverage
    const analysis = analyzeCoverage(coverageData);
    
    // Display results
    displayCoverageAnalysis(analysis);
    
    // Generate recommendations
    generateRecommendations(analysis);

  } catch (error) {
    console.error(colorize(`❌ Error generating coverage report: ${error.message}`, 'red'));
    process.exit(1);
  }
}

function analyzeCoverage(coverageData) {
  const analysis = {
    totalFiles: 0,
    coveredFiles: 0,
    uncoveredFiles: [],
    lowCoverageFiles: [],
    highCoverageFiles: [],
    criticalUncoveredFiles: [],
    overallStats: {
      lines: { covered: 0, total: 0, pct: 0 },
      functions: { covered: 0, total: 0, pct: 0 },
      branches: { covered: 0, total: 0, pct: 0 },
      statements: { covered: 0, total: 0, pct: 0 },
    },
  };

  // Critical file patterns that should have high coverage
  const criticalPatterns = [
    /src\/lib\/auth/,
    /src\/lib\/file-service/,
    /src\/server\/actions/,
    /src\/lib\/permissions/,
    /src\/payment/,
  ];

  for (const [filePath, fileData] of Object.entries(coverageData)) {
    // Skip node_modules and test files
    if (filePath.includes('node_modules') || filePath.includes('.test.') || filePath.includes('.spec.')) {
      continue;
    }

    analysis.totalFiles++;

    const stats = {
      lines: fileData.lines,
      functions: fileData.functions,
      branches: fileData.branches,
      statements: fileData.statements,
    };

    // Calculate average coverage for this file
    const avgCoverage = (stats.lines.pct + stats.functions.pct + stats.branches.pct + stats.statements.pct) / 4;

    if (avgCoverage > 0) {
      analysis.coveredFiles++;
    }

    // Categorize files by coverage level
    if (avgCoverage === 0) {
      analysis.uncoveredFiles.push({ path: filePath, coverage: avgCoverage });
    } else if (avgCoverage < 70) {
      analysis.lowCoverageFiles.push({ path: filePath, coverage: avgCoverage, stats });
    } else if (avgCoverage >= 90) {
      analysis.highCoverageFiles.push({ path: filePath, coverage: avgCoverage });
    }

    // Check if this is a critical file with low coverage
    const isCritical = criticalPatterns.some(pattern => pattern.test(filePath));
    if (isCritical && avgCoverage < 80) {
      analysis.criticalUncoveredFiles.push({ path: filePath, coverage: avgCoverage, stats });
    }

    // Aggregate overall stats
    Object.keys(analysis.overallStats).forEach(key => {
      analysis.overallStats[key].covered += stats[key].covered;
      analysis.overallStats[key].total += stats[key].total;
    });
  }

  // Calculate overall percentages
  Object.keys(analysis.overallStats).forEach(key => {
    const stat = analysis.overallStats[key];
    stat.pct = stat.total > 0 ? Math.round((stat.covered / stat.total) * 100) : 0;
  });

  // Sort arrays by coverage
  analysis.lowCoverageFiles.sort((a, b) => a.coverage - b.coverage);
  analysis.criticalUncoveredFiles.sort((a, b) => a.coverage - b.coverage);

  return analysis;
}

function displayCoverageAnalysis(analysis) {
  console.log(colorize('\n📊 Coverage Analysis Results\n', 'bold'));

  // Overall statistics
  console.log(colorize('Overall Coverage:', 'bold'));
  console.log(`  Lines:      ${getColoredPercentage(analysis.overallStats.lines.pct)}% (${analysis.overallStats.lines.covered}/${analysis.overallStats.lines.total})`);
  console.log(`  Functions:  ${getColoredPercentage(analysis.overallStats.functions.pct)}% (${analysis.overallStats.functions.covered}/${analysis.overallStats.functions.total})`);
  console.log(`  Branches:   ${getColoredPercentage(analysis.overallStats.branches.pct)}% (${analysis.overallStats.branches.covered}/${analysis.overallStats.branches.total})`);
  console.log(`  Statements: ${getColoredPercentage(analysis.overallStats.statements.pct)}% (${analysis.overallStats.statements.covered}/${analysis.overallStats.statements.total})`);

  // File statistics
  console.log(colorize('\nFile Coverage Summary:', 'bold'));
  console.log(`  Total files:          ${analysis.totalFiles}`);
  console.log(`  Files with coverage:  ${analysis.coveredFiles}`);
  console.log(`  Uncovered files:      ${colorize(analysis.uncoveredFiles.length, 'red')}`);
  console.log(`  Low coverage files:   ${colorize(analysis.lowCoverageFiles.length, 'yellow')}`);
  console.log(`  High coverage files:  ${colorize(analysis.highCoverageFiles.length, 'green')}`);

  // Critical files with low coverage
  if (analysis.criticalUncoveredFiles.length > 0) {
    console.log(colorize('\n⚠️  Critical Files with Low Coverage:', 'red'));
    analysis.criticalUncoveredFiles.forEach(file => {
      console.log(`  ${colorize(file.path, 'red')} - ${file.coverage.toFixed(1)}%`);
    });
  }

  // Files that need attention
  if (analysis.lowCoverageFiles.length > 0) {
    console.log(colorize('\n📝 Files Needing Attention (< 70% coverage):', 'yellow'));
    analysis.lowCoverageFiles.slice(0, 10).forEach(file => {
      console.log(`  ${file.path} - ${file.coverage.toFixed(1)}%`);
    });
    if (analysis.lowCoverageFiles.length > 10) {
      console.log(`  ... and ${analysis.lowCoverageFiles.length - 10} more`);
    }
  }

  // Well-tested files
  if (analysis.highCoverageFiles.length > 0) {
    console.log(colorize('\n✅ Well-tested Files (≥ 90% coverage):', 'green'));
    analysis.highCoverageFiles.slice(0, 5).forEach(file => {
      console.log(`  ${file.path} - ${file.coverage.toFixed(1)}%`);
    });
    if (analysis.highCoverageFiles.length > 5) {
      console.log(`  ... and ${analysis.highCoverageFiles.length - 5} more`);
    }
  }
}

function getColoredPercentage(pct) {
  if (pct >= 90) return colorize(pct, 'green');
  if (pct >= 70) return colorize(pct, 'yellow');
  return colorize(pct, 'red');
}

function generateRecommendations(analysis) {
  console.log(colorize('\n💡 Recommendations for Improving Test Coverage\n', 'cyan'));

  const recommendations = [];

  // Critical files recommendations
  if (analysis.criticalUncoveredFiles.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Critical Files Need Testing',
      description: `${analysis.criticalUncoveredFiles.length} critical files have low coverage. These files handle authentication, file management, or payment processing and should have >80% coverage.`,
      actions: [
        'Add unit tests for authentication functions',
        'Test file upload/download scenarios',
        'Test payment processing edge cases',
        'Add integration tests for critical workflows',
      ],
    });
  }

  // Overall coverage recommendations
  const overallCoverage = analysis.overallStats.lines.pct;
  if (overallCoverage < 70) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Overall Coverage Too Low',
      description: `Overall line coverage is ${overallCoverage}%. Target should be >80%.`,
      actions: [
        'Focus on testing business logic functions',
        'Add tests for error handling scenarios',
        'Test component rendering and interactions',
        'Add integration tests for API endpoints',
      ],
    });
  }

  // Uncovered files recommendations
  if (analysis.uncoveredFiles.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Completely Untested Files',
      description: `${analysis.uncoveredFiles.length} files have no test coverage.`,
      actions: [
        'Create basic unit tests for utility functions',
        'Add component tests for React components',
        'Test API route handlers',
        'Add integration tests for database operations',
      ],
    });
  }

  // Branch coverage recommendations
  if (analysis.overallStats.branches.pct < 70) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Low Branch Coverage',
      description: `Branch coverage is ${analysis.overallStats.branches.pct}%. This indicates missing tests for conditional logic.`,
      actions: [
        'Test all if/else branches',
        'Test error conditions and edge cases',
        'Add tests for different user roles/permissions',
        'Test validation logic with invalid inputs',
      ],
    });
  }

  // Function coverage recommendations
  if (analysis.overallStats.functions.pct < 80) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Untested Functions',
      description: `Function coverage is ${analysis.overallStats.functions.pct}%. Some functions are not being tested.`,
      actions: [
        'Identify and test utility functions',
        'Add tests for event handlers',
        'Test async functions and promises',
        'Add tests for callback functions',
      ],
    });
  }

  // Display recommendations
  recommendations.forEach((rec, index) => {
    const priorityColor = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'blue';
    console.log(`${colorize(rec.priority, priorityColor)} PRIORITY: ${colorize(rec.title, 'bold')}`);
    console.log(`${rec.description}\n`);
    console.log(colorize('Recommended Actions:', 'bold'));
    rec.actions.forEach(action => {
      console.log(`  • ${action}`);
    });
    if (index < recommendations.length - 1) {
      console.log('');
    }
  });

  // Next steps
  console.log(colorize('\n🎯 Next Steps:', 'bold'));
  console.log('1. Focus on HIGH priority recommendations first');
  console.log('2. Set up coverage monitoring in CI/CD pipeline');
  console.log('3. Add coverage requirements to pull request checks');
  console.log('4. Schedule regular coverage reviews');
  console.log('5. Consider adding mutation testing for critical code');

  // Useful commands
  console.log(colorize('\n🛠️  Useful Commands:', 'bold'));
  console.log('  pnpm test:coverage     - Run tests with coverage');
  console.log('  pnpm test:unit         - Run unit tests only');
  console.log('  pnpm test:integration  - Run integration tests only');
  console.log('  pnpm test:watch        - Run tests in watch mode');
}

// Run the coverage report
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCoverageReport();
} 