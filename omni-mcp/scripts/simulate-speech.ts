#!/usr/bin/env tsx

import { writeFileSync, existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

interface SpeechTest {
  id: string;
  text: string;
  language: string;
  expectedDuration: number; // seconds
  priority: 'low' | 'medium' | 'high';
}

interface SpeechResult {
  testId: string;
  text: string;
  language: string;
  ttsLatency: number; // milliseconds
  sttLatency: number; // milliseconds
  totalLatency: number; // milliseconds
  ttsSuccess: boolean;
  sttSuccess: boolean;
  ttsError?: string;
  sttError?: string;
  transcriptionAccuracy?: number; // 0-1
  audioQuality?: number; // 0-1
  timestamp: string;
}

interface SpeechSimulationReport {
  timestamp: string;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  ttsLatency: {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
  };
  sttLatency: {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
  };
  totalLatency: {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
  };
  accuracy: {
    mean: number;
    min: number;
    max: number;
  };
  languageBreakdown: Record<string, {
    tests: number;
    successRate: number;
    avgLatency: number;
    avgAccuracy: number;
  }>;
  results: SpeechResult[];
}

class SpeechSimulator {
  private results: SpeechResult[] = [];
  private tests: SpeechTest[] = [];

  constructor() {
    this.initializeTestCases();
  }

  private initializeTestCases(): void {
    this.tests = [
      // English tests
      { id: 'en-001', text: 'Hello, how are you today?', language: 'en', expectedDuration: 2, priority: 'high' },
      { id: 'en-002', text: 'The quick brown fox jumps over the lazy dog.', language: 'en', expectedDuration: 3, priority: 'medium' },
      { id: 'en-003', text: 'Learning a new language opens doors to new cultures and opportunities.', language: 'en', expectedDuration: 5, priority: 'high' },
      
      // Spanish tests
      { id: 'es-001', text: 'Hola, ¿cómo estás hoy?', language: 'es', expectedDuration: 2, priority: 'high' },
      { id: 'es-002', text: 'El zorro marrón rápido salta sobre el perro perezoso.', language: 'es', expectedDuration: 3, priority: 'medium' },
      { id: 'es-003', text: 'Aprender un nuevo idioma abre puertas a nuevas culturas y oportunidades.', language: 'es', expectedDuration: 5, priority: 'high' },
      
      // French tests
      { id: 'fr-001', text: 'Bonjour, comment allez-vous aujourd\'hui?', language: 'fr', expectedDuration: 2, priority: 'high' },
      { id: 'fr-002', text: 'Le renard brun rapide saute par-dessus le chien paresseux.', language: 'fr', expectedDuration: 3, priority: 'medium' },
      { id: 'fr-003', text: 'Apprendre une nouvelle langue ouvre des portes à de nouvelles cultures et opportunités.', language: 'fr', expectedDuration: 5, priority: 'high' },
      
      // German tests
      { id: 'de-001', text: 'Hallo, wie geht es dir heute?', language: 'de', expectedDuration: 2, priority: 'high' },
      { id: 'de-002', text: 'Der schnelle braune Fuchs springt über den faulen Hund.', language: 'de', expectedDuration: 3, priority: 'medium' },
      { id: 'de-003', text: 'Eine neue Sprache zu lernen öffnet Türen zu neuen Kulturen und Möglichkeiten.', language: 'de', expectedDuration: 5, priority: 'high' },
      
      // Complex/long tests
      { id: 'complex-001', text: 'This is a longer sentence that tests the system\'s ability to handle more complex speech patterns and longer audio durations.', language: 'en', expectedDuration: 8, priority: 'medium' },
      { id: 'complex-002', text: 'Esta es una oración más larga que prueba la capacidad del sistema para manejar patrones de habla más complejos y duraciones de audio más largas.', language: 'es', expectedDuration: 8, priority: 'medium' },
      
      // Edge cases
      { id: 'edge-001', text: '!@#$%^&*()', language: 'en', expectedDuration: 1, priority: 'low' },
      { id: 'edge-002', text: '123456789', language: 'en', expectedDuration: 1, priority: 'low' },
      { id: 'edge-003', text: '', language: 'en', expectedDuration: 0, priority: 'low' },
    ];
  }

  async simulateTTS(text: string, language: string): Promise<{ latency: number; success: boolean; error?: string; audioUrl?: string }> {
    const startTime = Date.now();
    
    try {
      // Simulate TTS API call
      const response = await fetch('http://localhost:3000/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language,
          voice: this.getVoiceForLanguage(language),
          quality: 'high',
        }),
      });

      const latency = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          latency,
          success: false,
          error: `TTS API error: ${response.status} ${response.statusText}`,
        };
      }

      const result = await response.json();
      
      return {
        latency,
        success: true,
        audioUrl: result.audioUrl,
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        latency,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown TTS error',
      };
    }
  }

  async simulateSTT(audioUrl: string, language: string): Promise<{ latency: number; success: boolean; transcription?: string; accuracy?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simulate STT API call
      const response = await fetch('http://localhost:3000/api/stt/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl,
          language,
          model: 'whisper-1',
        }),
      });

      const latency = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          latency,
          success: false,
          error: `STT API error: ${response.status} ${response.statusText}`,
        };
      }

      const result = await response.json();
      
      return {
        latency,
        success: true,
        transcription: result.text,
        accuracy: result.confidence,
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        latency,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown STT error',
      };
    }
  }

  private getVoiceForLanguage(language: string): string {
    const voices: Record<string, string> = {
      'en': 'alloy',
      'es': 'nova',
      'fr': 'shimmer',
      'de': 'echo',
      'it': 'fable',
      'pt': 'onyx',
    };
    return voices[language] || 'alloy';
  }

  private calculateAccuracy(original: string, transcription: string): number {
    if (!transcription) return 0;
    
    // Simple word-based accuracy calculation
    const originalWords = original.toLowerCase().split(/\s+/);
    const transcriptionWords = transcription.toLowerCase().split(/\s+/);
    
    let matches = 0;
    const maxLength = Math.max(originalWords.length, transcriptionWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (originalWords[i] === transcriptionWords[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }

  async runSimulation(concurrency: number = 3): Promise<SpeechSimulationReport> {
    console.log(`🚀 Starting speech simulation with ${this.tests.length} tests (concurrency: ${concurrency})`);
    
    // Process tests in batches
    for (let i = 0; i < this.tests.length; i += concurrency) {
      const batch = this.tests.slice(i, i + concurrency);
      const promises = batch.map(test => this.runTest(test));
      
      const batchResults = await Promise.all(promises);
      this.results.push(...batchResults);
      
      console.log(`✅ Completed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(this.tests.length / concurrency)}`);
    }
    
    return this.generateReport();
  }

  private async runTest(test: SpeechTest): Promise<SpeechResult> {
    console.log(`🎤 Testing: ${test.id} (${test.language})`);
    
    // Skip empty text tests
    if (!test.text.trim()) {
      return {
        testId: test.id,
        text: test.text,
        language: test.language,
        ttsLatency: 0,
        sttLatency: 0,
        totalLatency: 0,
        ttsSuccess: false,
        sttSuccess: false,
        ttsError: 'Empty text',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Step 1: TTS
    const ttsResult = await this.simulateTTS(test.text, test.language);
    
    if (!ttsResult.success) {
      return {
        testId: test.id,
        text: test.text,
        language: test.language,
        ttsLatency: ttsResult.latency,
        sttLatency: 0,
        totalLatency: ttsResult.latency,
        ttsSuccess: false,
        sttSuccess: false,
        ttsError: ttsResult.error,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Step 2: STT
    const sttResult = await this.simulateSTT(ttsResult.audioUrl!, test.language);
    
    const accuracy = sttResult.success && sttResult.transcription 
      ? this.calculateAccuracy(test.text, sttResult.transcription)
      : undefined;
    
    return {
      testId: test.id,
      text: test.text,
      language: test.language,
      ttsLatency: ttsResult.latency,
      sttLatency: sttResult.latency,
      totalLatency: ttsResult.latency + sttResult.latency,
      ttsSuccess: ttsResult.success,
      sttSuccess: sttResult.success,
      ttsError: ttsResult.error,
      sttError: sttResult.error,
      transcriptionAccuracy: accuracy,
      timestamp: new Date().toISOString(),
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private generateReport(): SpeechSimulationReport {
    const successfulTests = this.results.filter(r => r.ttsSuccess && r.sttSuccess);
    const failedTests = this.results.length - successfulTests.length;
    
    const ttsLatencies = this.results.map(r => r.ttsLatency);
    const sttLatencies = this.results.map(r => r.sttLatency);
    const totalLatencies = this.results.map(r => r.totalLatency);
    const accuracies = this.results.filter(r => r.transcriptionAccuracy !== undefined).map(r => r.transcriptionAccuracy!);
    
    const languageBreakdown: Record<string, any> = {};
    
    // Group by language
    const languageGroups = this.results.reduce((groups, result) => {
      if (!groups[result.language]) groups[result.language] = [];
      groups[result.language].push(result);
      return groups;
    }, {} as Record<string, SpeechResult[]>);
    
    Object.entries(languageGroups).forEach(([language, results]) => {
      const successful = results.filter(r => r.ttsSuccess && r.sttSuccess);
      const avgLatency = results.reduce((sum, r) => sum + r.totalLatency, 0) / results.length;
      const avgAccuracy = successful.reduce((sum, r) => sum + (r.transcriptionAccuracy || 0), 0) / Math.max(successful.length, 1);
      
      languageBreakdown[language] = {
        tests: results.length,
        successRate: successful.length / results.length,
        avgLatency,
        avgAccuracy,
      };
    });
    
    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      successfulTests,
      failedTests,
      ttsLatency: {
        p50: this.calculatePercentile(ttsLatencies, 50),
        p95: this.calculatePercentile(ttsLatencies, 95),
        p99: this.calculatePercentile(ttsLatencies, 99),
        min: Math.min(...ttsLatencies),
        max: Math.max(...ttsLatencies),
        mean: ttsLatencies.reduce((sum, val) => sum + val, 0) / ttsLatencies.length,
      },
      sttLatency: {
        p50: this.calculatePercentile(sttLatencies, 50),
        p95: this.calculatePercentile(sttLatencies, 95),
        p99: this.calculatePercentile(sttLatencies, 99),
        min: Math.min(...sttLatencies),
        max: Math.max(...sttLatencies),
        mean: sttLatencies.reduce((sum, val) => sum + val, 0) / sttLatencies.length,
      },
      totalLatency: {
        p50: this.calculatePercentile(totalLatencies, 50),
        p95: this.calculatePercentile(totalLatencies, 95),
        p99: this.calculatePercentile(totalLatencies, 99),
        min: Math.min(...totalLatencies),
        max: Math.max(...totalLatencies),
        mean: totalLatencies.reduce((sum, val) => sum + val, 0) / totalLatencies.length,
      },
      accuracy: {
        mean: accuracies.length > 0 ? accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length : 0,
        min: accuracies.length > 0 ? Math.min(...accuracies) : 0,
        max: accuracies.length > 0 ? Math.max(...accuracies) : 0,
      },
      languageBreakdown,
      results: this.results,
    };
  }

  async saveReport(report: SpeechSimulationReport, outputPath: string): Promise<void> {
    // Ensure reports directory exists
    const reportsDir = path.dirname(outputPath);
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved to: ${outputPath}`);
  }

  printSummary(report: SpeechSimulationReport): void {
    console.log('\n📊 Speech Simulation Summary');
    console.log('============================');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Successful Tests: ${report.successfulTests} (${((report.successfulTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed Tests: ${report.failedTests}`);
    
    console.log('\n⏱️  TTS Latency (ms):');
    console.log(`  P50: ${report.ttsLatency.p50.toFixed(0)}`);
    console.log(`  P95: ${report.ttsLatency.p95.toFixed(0)}`);
    console.log(`  P99: ${report.ttsLatency.p99.toFixed(0)}`);
    console.log(`  Mean: ${report.ttsLatency.mean.toFixed(0)}`);
    
    console.log('\n🎤 STT Latency (ms):');
    console.log(`  P50: ${report.sttLatency.p50.toFixed(0)}`);
    console.log(`  P95: ${report.sttLatency.p95.toFixed(0)}`);
    console.log(`  P99: ${report.sttLatency.p99.toFixed(0)}`);
    console.log(`  Mean: ${report.sttLatency.mean.toFixed(0)}`);
    
    console.log('\n🔄 Total Latency (ms):');
    console.log(`  P50: ${report.totalLatency.p50.toFixed(0)}`);
    console.log(`  P95: ${report.totalLatency.p95.toFixed(0)}`);
    console.log(`  P99: ${report.totalLatency.p99.toFixed(0)}`);
    console.log(`  Mean: ${report.totalLatency.mean.toFixed(0)}`);
    
    console.log('\n🎯 Accuracy:');
    console.log(`  Mean: ${(report.accuracy.mean * 100).toFixed(1)}%`);
    console.log(`  Min: ${(report.accuracy.min * 100).toFixed(1)}%`);
    console.log(`  Max: ${(report.accuracy.max * 100).toFixed(1)}%`);
    
    console.log('\n🌍 Language Breakdown:');
    Object.entries(report.languageBreakdown).forEach(([language, stats]) => {
      console.log(`  ${language}: ${stats.tests} tests, ${(stats.successRate * 100).toFixed(1)}% success, ${stats.avgLatency.toFixed(0)}ms avg latency, ${(stats.avgAccuracy * 100).toFixed(1)}% accuracy`);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const concurrency = parseInt(args[0]) || 3;
  const outputPath = args[1] || '/workspace/reports/speech-simulation.json';
  
  console.log('🚀 Starting speech simulation...');
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Output path: ${outputPath}`);
  
  const simulator = new SpeechSimulator();
  
  try {
    const report = await simulator.runSimulation(concurrency);
    await simulator.saveReport(report, outputPath);
    simulator.printSummary(report);
    
    // Check if we meet SLOs
    const ttsSLO = report.ttsLatency.p95 <= 200; // 200ms SLO
    const sttSLO = report.sttLatency.p95 <= 2000; // 2s SLO
    const accuracySLO = report.accuracy.mean >= 0.8; // 80% accuracy SLO
    
    console.log('\n🎯 SLO Compliance:');
    console.log(`TTS P95 ≤ 200ms: ${ttsSLO ? '✅' : '❌'} (${report.ttsLatency.p95.toFixed(0)}ms)`);
    console.log(`STT P95 ≤ 2000ms: ${sttSLO ? '✅' : '❌'} (${report.sttLatency.p95.toFixed(0)}ms)`);
    console.log(`Accuracy ≥ 80%: ${accuracySLO ? '✅' : '❌'} (${(report.accuracy.mean * 100).toFixed(1)}%)`);
    
    if (ttsSLO && sttSLO && accuracySLO) {
      console.log('\n✅ All SLOs met!');
      process.exit(0);
    } else {
      console.log('\n❌ Some SLOs not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Speech simulation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}