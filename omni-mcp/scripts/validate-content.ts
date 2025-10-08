#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { globby } from 'globby';
import { z } from 'zod';
import path from 'node:path';

// Import schemas
import { 
  LessonSchema, 
  QuizItemSchema, 
  FlashcardSchema,
  LanguageCodeSchema,
  DifficultyLevelSchema 
} from '../schemas/core.js';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    type: string;
    language: string;
    difficulty: string;
    size: number;
  };
}

interface ValidationReport {
  timestamp: string;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  totalErrors: number;
  totalWarnings: number;
  languageCoverage: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  contentTypeDistribution: Record<string, number>;
  results: ValidationResult[];
}

class ContentValidator {
  private results: ValidationResult[] = [];
  private languageCoverage: Record<string, number> = {};
  private difficultyDistribution: Record<string, number> = {};
  private contentTypeDistribution: Record<string, number> = {};

  async validateContent(contentPath: string): Promise<ValidationReport> {
    console.log(`🔍 Validating content in: ${contentPath}`);
    
    // Find all content files
    const patterns = [
      `${contentPath}/lessons/**/*.json`,
      `${contentPath}/quiz/**/*.json`,
      `${contentPath}/flashcards/**/*.json`,
      `${contentPath}/exercises/**/*.json`,
    ];
    
    const files = await globby(patterns);
    console.log(`📁 Found ${files.length} content files`);

    // Validate each file
    for (const file of files) {
      await this.validateFile(file);
    }

    return this.generateReport();
  }

  private async validateFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Determine content type and schema
      const { schema, type } = this.determineSchema(filePath, data);
      
      // Validate against schema
      const result = schema.safeParse(data);
      
      const validationResult: ValidationResult = {
        file: filePath,
        valid: result.success,
        errors: result.success ? [] : result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        metadata: {
          type,
          language: data.language || 'unknown',
          difficulty: data.difficulty || 'unknown',
          size: content.length,
        }
      };

      // Additional business rule validations
      this.validateBusinessRules(data, validationResult);
      
      // Update coverage statistics
      this.updateCoverageStats(validationResult);
      
      this.results.push(validationResult);
      
      if (result.success) {
        console.log(`✅ ${path.basename(filePath)} - Valid`);
      } else {
        console.log(`❌ ${path.basename(filePath)} - Invalid`);
        console.log(`   Errors: ${validationResult.errors.join(', ')}`);
      }
      
    } catch (error) {
      const validationResult: ValidationResult = {
        file: filePath,
        valid: false,
        errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        metadata: {
          type: 'unknown',
          language: 'unknown',
          difficulty: 'unknown',
          size: 0,
        }
      };
      
      this.results.push(validationResult);
      console.log(`❌ ${path.basename(filePath)} - Parse Error`);
    }
  }

  private determineSchema(filePath: string, data: any): { schema: z.ZodSchema; type: string } {
    if (filePath.includes('lessons') || data.type === 'lesson') {
      return { schema: LessonSchema, type: 'lesson' };
    } else if (filePath.includes('quiz') || data.type === 'quiz') {
      return { schema: QuizItemSchema, type: 'quiz' };
    } else if (filePath.includes('flashcards') || data.type === 'flashcard') {
      return { schema: FlashcardSchema, type: 'flashcard' };
    } else {
      // Default to lesson schema
      return { schema: LessonSchema, type: 'lesson' };
    }
  }

  private validateBusinessRules(data: any, result: ValidationResult): void {
    // Content length validations
    if (data.title && data.title.length < 5) {
      result.warnings.push('Title is too short (minimum 5 characters)');
    }
    
    if (data.content?.text && data.content.text.length < 100) {
      result.warnings.push('Content text is too short (minimum 100 characters)');
    }
    
    // Language validations
    if (data.language && !LanguageCodeSchema.safeParse(data.language).success) {
      result.errors.push(`Invalid language code: ${data.language}`);
    }
    
    // Difficulty validations
    if (data.difficulty && !DifficultyLevelSchema.safeParse(data.difficulty).success) {
      result.errors.push(`Invalid difficulty level: ${data.difficulty}`);
    }
    
    // Translation validations
    if (data.translations && Array.isArray(data.translations)) {
      const requiredLanguages = ['en', 'es', 'fr']; // Add your required languages
      const providedLanguages = data.translations.map((t: any) => t.language);
      const missingLanguages = requiredLanguages.filter(lang => !providedLanguages.includes(lang));
      
      if (missingLanguages.length > 0) {
        result.warnings.push(`Missing translations for: ${missingLanguages.join(', ')}`);
      }
    }
    
    // Media URL validations
    const mediaFields = ['audioUrl', 'imageUrl', 'videoUrl'];
    for (const field of mediaFields) {
      if (data[field] && !this.isValidUrl(data[field])) {
        result.warnings.push(`Invalid ${field}: ${data[field]}`);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private updateCoverageStats(result: ValidationResult): void {
    // Language coverage
    const lang = result.metadata.language;
    this.languageCoverage[lang] = (this.languageCoverage[lang] || 0) + 1;
    
    // Difficulty distribution
    const difficulty = result.metadata.difficulty;
    this.difficultyDistribution[difficulty] = (this.difficultyDistribution[difficulty] || 0) + 1;
    
    // Content type distribution
    const type = result.metadata.type;
    this.contentTypeDistribution[type] = (this.contentTypeDistribution[type] || 0) + 1;
  }

  private generateReport(): ValidationReport {
    const validFiles = this.results.filter(r => r.valid).length;
    const invalidFiles = this.results.length - validFiles;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      timestamp: new Date().toISOString(),
      totalFiles: this.results.length,
      validFiles,
      invalidFiles,
      totalErrors,
      totalWarnings,
      languageCoverage: this.languageCoverage,
      difficultyDistribution: this.difficultyDistribution,
      contentTypeDistribution: this.contentTypeDistribution,
      results: this.results,
    };
  }

  async saveReport(report: ValidationReport, outputPath: string): Promise<void> {
    // Ensure reports directory exists
    const reportsDir = path.dirname(outputPath);
    if (!existsSync(reportsDir)) {
      require('node:fs').mkdirSync(reportsDir, { recursive: true });
    }
    
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved to: ${outputPath}`);
  }

  printSummary(report: ValidationReport): void {
    console.log('\n📊 Validation Summary');
    console.log('====================');
    console.log(`Total Files: ${report.totalFiles}`);
    console.log(`Valid Files: ${report.validFiles} (${((report.validFiles / report.totalFiles) * 100).toFixed(1)}%)`);
    console.log(`Invalid Files: ${report.invalidFiles}`);
    console.log(`Total Errors: ${report.totalErrors}`);
    console.log(`Total Warnings: ${report.totalWarnings}`);
    
    console.log('\n🌍 Language Coverage:');
    Object.entries(report.languageCoverage)
      .sort(([,a], [,b]) => b - a)
      .forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} files`);
      });
    
    console.log('\n📈 Difficulty Distribution:');
    Object.entries(report.difficultyDistribution)
      .forEach(([difficulty, count]) => {
        console.log(`  ${difficulty}: ${count} files`);
      });
    
    console.log('\n📚 Content Type Distribution:');
    Object.entries(report.contentTypeDistribution)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} files`);
      });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const contentPath = args[0] || '/workspace/content';
  const outputPath = args[1] || '/workspace/reports/content-validation.json';
  
  console.log('🚀 Starting content validation...');
  console.log(`Content path: ${contentPath}`);
  console.log(`Output path: ${outputPath}`);
  
  const validator = new ContentValidator();
  
  try {
    const report = await validator.validateContent(contentPath);
    await validator.saveReport(report, outputPath);
    validator.printSummary(report);
    
    // Exit with error code if there are validation failures
    if (report.invalidFiles > 0) {
      console.log(`\n❌ Validation failed: ${report.invalidFiles} files have errors`);
      process.exit(1);
    } else {
      console.log('\n✅ All content files are valid!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Validation process failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}