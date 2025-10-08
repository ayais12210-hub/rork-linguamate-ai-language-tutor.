import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';

// Hallucination detection schemas
const HallucinationCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['fact_check', 'consistency', 'coherence', 'relevance', 'safety', 'bias']),
  enabled: z.boolean().default(true),
  threshold: z.number().min(0).max(1).default(0.8), // Confidence threshold
  critical: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  config: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
});

const HallucinationResultSchema = z.object({
  id: z.string(),
  input: z.any(),
  output: z.any(),
  checks: z.array(z.object({
    checkId: z.string(),
    type: z.string(),
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    passed: z.boolean(),
    message: z.string().optional(),
    details: z.record(z.any()).default({}),
    violations: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      message: z.string(),
      data: z.any().optional(),
      position: z.object({
        start: z.number(),
        end: z.number(),
      }).optional(),
    })).default([]),
  })),
  overallScore: z.number().min(0).max(1),
  overallConfidence: z.number().min(0).max(1),
  passed: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).default({}),
});

const HallucinationReportSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  totalChecks: z.number(),
  passedChecks: z.number(),
  failedChecks: z.number(),
  averageScore: z.number(),
  averageConfidence: z.number(),
  riskDistribution: z.record(z.number()),
  violations: z.array(z.object({
    type: z.string(),
    count: z.number(),
    severity: z.string(),
  })),
  recommendations: z.array(z.string()).default([]),
});

export type HallucinationCheck = z.infer<typeof HallucinationCheckSchema>;
export type HallucinationResult = z.infer<typeof HallucinationResultSchema>;
export type HallucinationReport = z.infer<typeof HallucinationReportSchema>;

export interface HallucinationContext {
  configManager: ConfigManager;
  securityManager: SecurityManager;
  monitoringSystem: MonitoringSystem;
  cacheManager: CacheManager;
  logger: ReturnType<typeof createLogger>;
}

export interface HallucinationViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data?: any;
  position?: { start: number; end: number };
}

export interface HallucinationCheckFunction {
  (input: any, output: any, context: HallucinationContext, config: any): Promise<{
    score: number;
    confidence: number;
    passed: boolean;
    message?: string;
    violations?: HallucinationViolation[];
    details?: Record<string, any>;
  }>;
}

export class HallucinationDetectionSystem extends EventEmitter {
  private hallucinationChecks: Map<string, HallucinationCheck> = new Map();
  private checkFunctions: Map<string, HallucinationCheckFunction> = new Map();
  private checkResults: Map<string, HallucinationResult[]> = new Map(); // checkId -> results history
  private context: HallucinationContext;
  private logger: ReturnType<typeof createLogger>;
  private isRunning: boolean = false;
  private knowledgeBase: Map<string, any> = new Map(); // For fact-checking
  private consistencyCache: Map<string, any> = new Map(); // For consistency checks

  constructor(
    context: HallucinationContext,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.context = context;
    this.logger = logger;
  }

  /**
   * Register a hallucination check
   */
  async registerHallucinationCheck(check: HallucinationCheck, checkFunction: HallucinationCheckFunction): Promise<void> {
    try {
      const validatedCheck = HallucinationCheckSchema.parse(check);
      
      this.hallucinationChecks.set(validatedCheck.id, validatedCheck);
      this.checkFunctions.set(validatedCheck.id, checkFunction);
      
      // Initialize results history
      this.checkResults.set(validatedCheck.id, []);

      this.logger.info({
        checkId: validatedCheck.id,
        name: validatedCheck.name,
        type: validatedCheck.type,
        threshold: validatedCheck.threshold,
        critical: validatedCheck.critical,
      }, 'Hallucination check registered');

      this.emit('hallucination_check:registered', { check: validatedCheck });

    } catch (error) {
      this.logger.error({ error, check }, 'Failed to register hallucination check');
      throw error;
    }
  }

  /**
   * Start the hallucination detection system
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Initialize knowledge base
    await this.initializeKnowledgeBase();
    
    // Register default hallucination checks
    await this.registerDefaultHallucinationChecks();
    
    this.logger.info('Hallucination detection system started');
  }

  /**
   * Stop the hallucination detection system
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Hallucination detection system stopped');
  }

  /**
   * Initialize knowledge base for fact-checking
   */
  private async initializeKnowledgeBase(): Promise<void> {
    // This would load a knowledge base for fact-checking
    // For now, we'll initialize with some sample data
    
    this.knowledgeBase.set('languages', {
      'English': { code: 'en', nativeSpeakers: 400000000 },
      'Spanish': { code: 'es', nativeSpeakers: 500000000 },
      'French': { code: 'fr', nativeSpeakers: 280000000 },
      'German': { code: 'de', nativeSpeakers: 100000000 },
    });
    
    this.knowledgeBase.set('grammar_rules', {
      'english': {
        'present_perfect': 'have/has + past participle',
        'past_simple': 'verb + ed (regular) or irregular form',
        'future_will': 'will + base verb',
      },
      'spanish': {
        'presente': 'verb stem + ending',
        'preterito': 'verb stem + preterite ending',
        'futuro': 'infinitive + future ending',
      },
    });
    
    this.knowledgeBase.set('common_facts', {
      'world_capitals': {
        'France': 'Paris',
        'Spain': 'Madrid',
        'Germany': 'Berlin',
        'Italy': 'Rome',
      },
      'historical_events': {
        'world_war_2': { start: 1939, end: 1945 },
        'spanish_civil_war': { start: 1936, end: 1939 },
      },
    });
    
    this.logger.info('Knowledge base initialized');
  }

  /**
   * Register default hallucination checks
   */
  private async registerDefaultHallucinationChecks(): Promise<void> {
    // Fact-checking checks
    await this.registerHallucinationCheck({
      id: 'fact-check-knowledge',
      name: 'Knowledge Base Fact Check',
      description: 'Check facts against knowledge base',
      type: 'fact_check',
      threshold: 0.9,
      critical: true,
      tags: ['fact_check', 'knowledge'],
      config: {
        knowledgeBase: 'common_facts',
        strictMode: true,
      },
    }, this.checkFactsAgainstKnowledgeBase.bind(this));

    await this.registerHallucinationCheck({
      id: 'fact-check-grammar',
      name: 'Grammar Fact Check',
      description: 'Check grammar rules against knowledge base',
      type: 'fact_check',
      threshold: 0.8,
      critical: true,
      tags: ['fact_check', 'grammar'],
      config: {
        knowledgeBase: 'grammar_rules',
        languageDetection: true,
      },
    }, this.checkGrammarFacts.bind(this));

    // Consistency checks
    await this.registerHallucinationCheck({
      id: 'consistency-logical',
      name: 'Logical Consistency Check',
      description: 'Check for logical inconsistencies in output',
      type: 'consistency',
      threshold: 0.7,
      critical: false,
      tags: ['consistency', 'logic'],
      config: {
        checkContradictions: true,
        checkImplications: true,
      },
    }, this.checkLogicalConsistency.bind(this));

    await this.registerHallucinationCheck({
      id: 'consistency-temporal',
      name: 'Temporal Consistency Check',
      description: 'Check for temporal inconsistencies',
      type: 'consistency',
      threshold: 0.8,
      critical: false,
      tags: ['consistency', 'temporal'],
      config: {
        checkTimeline: true,
        checkDates: true,
      },
    }, this.checkTemporalConsistency.bind(this));

    // Coherence checks
    await this.registerHallucinationCheck({
      id: 'coherence-semantic',
      name: 'Semantic Coherence Check',
      description: 'Check semantic coherence of output',
      type: 'coherence',
      threshold: 0.6,
      critical: false,
      tags: ['coherence', 'semantic'],
      config: {
        checkTopicConsistency: true,
        checkContextRelevance: true,
      },
    }, this.checkSemanticCoherence.bind(this));

    await this.registerHallucinationCheck({
      id: 'coherence-structural',
      name: 'Structural Coherence Check',
      description: 'Check structural coherence of output',
      type: 'coherence',
      threshold: 0.7,
      critical: false,
      tags: ['coherence', 'structural'],
      config: {
        checkSentenceStructure: true,
        checkParagraphFlow: true,
      },
    }, this.checkStructuralCoherence.bind(this));

    // Relevance checks
    await this.registerHallucinationCheck({
      id: 'relevance-topic',
      name: 'Topic Relevance Check',
      description: 'Check relevance to input topic',
      type: 'relevance',
      threshold: 0.6,
      critical: false,
      tags: ['relevance', 'topic'],
      config: {
        topicExtraction: true,
        relevanceScoring: true,
      },
    }, this.checkTopicRelevance.bind(this));

    // Safety checks
    await this.registerHallucinationCheck({
      id: 'safety-content',
      name: 'Content Safety Check',
      description: 'Check for unsafe or harmful content',
      type: 'safety',
      threshold: 0.9,
      critical: true,
      tags: ['safety', 'content'],
      config: {
        checkToxicity: true,
        checkBias: true,
        checkSensitiveContent: true,
      },
    }, this.checkContentSafety.bind(this));

    // Bias checks
    await this.registerHallucinationCheck({
      id: 'bias-detection',
      name: 'Bias Detection Check',
      description: 'Detect bias in output',
      type: 'bias',
      threshold: 0.8,
      critical: false,
      tags: ['bias', 'fairness'],
      config: {
        checkGenderBias: true,
        checkCulturalBias: true,
        checkRacialBias: true,
      },
    }, this.checkBias.bind(this));
  }

  /**
   * Check for hallucinations in AI output
   */
  async checkHallucinations(input: any, output: any, context: any = {}): Promise<HallucinationResult> {
    const startTime = Date.now();
    const checks: any[] = [];
    let totalScore = 0;
    let totalConfidence = 0;
    let passedChecks = 0;
    let criticalFailures = 0;
    const allViolations: HallucinationViolation[] = [];

    for (const [checkId, check] of this.hallucinationChecks) {
      if (!check.enabled) continue;

      try {
        const checkFunction = this.checkFunctions.get(checkId);
        if (!checkFunction) continue;

        const checkResult = await checkFunction(input, output, this.context, check.config);
        
        const checkData = {
          checkId,
          type: check.type,
          score: checkResult.score,
          confidence: checkResult.confidence,
          passed: checkResult.score >= check.threshold,
          message: checkResult.message,
          details: checkResult.details || {},
          violations: checkResult.violations || [],
        };

        checks.push(checkData);
        
        totalScore += checkResult.score;
        totalConfidence += checkResult.confidence;
        
        if (checkData.passed) {
          passedChecks++;
        } else if (check.critical) {
          criticalFailures++;
        }
        
        allViolations.push(...checkResult.violations);

      } catch (error) {
        this.logger.error({ checkId, error }, 'Hallucination check failed');
        
        const checkData = {
          checkId,
          type: check.type,
          score: 0,
          confidence: 0,
          passed: false,
          message: error instanceof Error ? error.message : 'Check failed',
          details: { error: error instanceof Error ? error.stack : String(error) },
          violations: [{
            type: 'check_error',
            severity: 'critical' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
          }],
        };
        
        checks.push(checkData);
        criticalFailures++;
      }
    }

    const overallScore = checks.length > 0 ? totalScore / checks.length : 0;
    const overallConfidence = checks.length > 0 ? totalConfidence / checks.length : 0;
    const passed = criticalFailures === 0 && overallScore >= 0.7;
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalFailures > 0) {
      riskLevel = 'critical';
    } else if (overallScore < 0.5) {
      riskLevel = 'high';
    } else if (overallScore < 0.7) {
      riskLevel = 'medium';
    }

    const result: HallucinationResult = {
      id: `hallucination_check_${Date.now()}`,
      input,
      output,
      checks,
      overallScore,
      overallConfidence,
      passed,
      riskLevel,
      message: passed ? 'Hallucination check passed' : 'Hallucination detected',
      timestamp: new Date(),
      metadata: {
        executionTime: Date.now() - startTime,
        totalChecks: checks.length,
        passedChecks,
        criticalFailures,
        context,
      },
    };

    // Store result in history
    const results = this.checkResults.get('all') || [];
    results.push(result);
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
    this.checkResults.set('all', results);

    // Record metrics
    this.context.monitoringSystem.recordMetric(
      'hallucination_check_score',
      overallScore,
      'gauge',
      { riskLevel, passed: passed.toString() }
    );

    this.context.monitoringSystem.recordMetric(
      'hallucination_check_violations',
      allViolations.length,
      'counter',
      { riskLevel }
    );

    this.logger.info({
      overallScore,
      overallConfidence,
      passed,
      riskLevel,
      totalChecks: checks.length,
      passedChecks,
      criticalFailures,
      violations: allViolations.length,
    }, 'Hallucination check completed');

    this.emit('hallucination_check:completed', { result });

    return result;
  }

  // Default hallucination check implementations

  /**
   * Check facts against knowledge base
   */
  private async checkFactsAgainstKnowledgeBase(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 1.0;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      const knowledgeBase = this.knowledgeBase.get(config.knowledgeBase);
      
      if (!knowledgeBase) {
        return {
          score: 0.5,
          confidence: 0.3,
          passed: false,
          message: 'Knowledge base not available',
          violations: [{
            type: 'knowledge_base_unavailable',
            severity: 'medium',
            message: 'Knowledge base not available for fact-checking',
          }],
        };
      }

      // Extract facts from output (simplified)
      const facts = this.extractFacts(outputText);
      let verifiedFacts = 0;
      let totalFacts = facts.length;

      for (const fact of facts) {
        const verification = this.verifyFact(fact, knowledgeBase);
        if (verification.verified) {
          verifiedFacts++;
        } else {
          violations.push({
            type: 'fact_verification_failed',
            severity: verification.severity,
            message: `Fact verification failed: ${fact}`,
            data: { fact, verification },
          });
          score -= 0.2;
        }
      }

      if (totalFacts > 0) {
        score = verifiedFacts / totalFacts;
        confidence = Math.min(score + 0.2, 1.0);
      }

      return {
        score,
        confidence,
        passed: score >= 0.8,
        message: `${verifiedFacts}/${totalFacts} facts verified`,
        violations,
        details: {
          totalFacts,
          verifiedFacts,
          knowledgeBase: config.knowledgeBase,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Fact-checking failed',
        violations: [{
          type: 'fact_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check grammar facts
   */
  private async checkGrammarFacts(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 1.0;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      const grammarRules = this.knowledgeBase.get('grammar_rules');
      
      if (!grammarRules) {
        return {
          score: 0.5,
          confidence: 0.3,
          passed: false,
          message: 'Grammar rules not available',
          violations: [{
            type: 'grammar_rules_unavailable',
            severity: 'medium',
            message: 'Grammar rules not available for validation',
          }],
        };
      }

      // Detect language and check grammar (simplified)
      const language = this.detectLanguage(outputText);
      const languageRules = grammarRules[language];
      
      if (!languageRules) {
        return {
          score: 0.7,
          confidence: 0.5,
          passed: true,
          message: 'Language not supported for grammar checking',
          violations: [],
        };
      }

      // Check grammar rules (simplified implementation)
      const grammarErrors = this.checkGrammarRules(outputText, languageRules);
      
      if (grammarErrors.length > 0) {
        score = Math.max(0, 1.0 - (grammarErrors.length * 0.1));
        confidence = score;
        
        for (const error of grammarErrors) {
          violations.push({
            type: 'grammar_error',
            severity: 'medium',
            message: error.message,
            data: error,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.8,
        message: grammarErrors.length === 0 ? 'Grammar check passed' : `${grammarErrors.length} grammar errors found`,
        violations,
        details: {
          language,
          grammarErrors: grammarErrors.length,
          rules: Object.keys(languageRules),
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Grammar checking failed',
        violations: [{
          type: 'grammar_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check logical consistency
   */
  private async checkLogicalConsistency(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.8;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Check for contradictions (simplified)
      const contradictions = this.findContradictions(outputText);
      
      if (contradictions.length > 0) {
        score = Math.max(0, 1.0 - (contradictions.length * 0.3));
        
        for (const contradiction of contradictions) {
          violations.push({
            type: 'logical_contradiction',
            severity: 'high',
            message: contradiction.message,
            data: contradiction,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.7,
        message: contradictions.length === 0 ? 'Logical consistency check passed' : `${contradictions.length} contradictions found`,
        violations,
        details: {
          contradictions: contradictions.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Logical consistency check failed',
        violations: [{
          type: 'consistency_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check temporal consistency
   */
  private async checkTemporalConsistency(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.8;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Extract dates and check temporal consistency (simplified)
      const dates = this.extractDates(outputText);
      const temporalIssues = this.checkTemporalConsistency(dates);
      
      if (temporalIssues.length > 0) {
        score = Math.max(0, 1.0 - (temporalIssues.length * 0.2));
        
        for (const issue of temporalIssues) {
          violations.push({
            type: 'temporal_inconsistency',
            severity: 'medium',
            message: issue.message,
            data: issue,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.8,
        message: temporalIssues.length === 0 ? 'Temporal consistency check passed' : `${temporalIssues.length} temporal issues found`,
        violations,
        details: {
          dates: dates.length,
          temporalIssues: temporalIssues.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Temporal consistency check failed',
        violations: [{
          type: 'temporal_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check semantic coherence
   */
  private async checkSemanticCoherence(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.7;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Check topic consistency (simplified)
      const topics = this.extractTopics(outputText);
      const coherenceScore = this.calculateCoherenceScore(topics);
      
      score = coherenceScore;
      
      if (coherenceScore < 0.6) {
        violations.push({
          type: 'low_coherence',
          severity: 'medium',
          message: 'Output shows low semantic coherence',
          data: { coherenceScore, topics },
        });
      }

      return {
        score,
        confidence,
        passed: score >= 0.6,
        message: `Semantic coherence score: ${coherenceScore.toFixed(2)}`,
        violations,
        details: {
          coherenceScore,
          topics: topics.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Semantic coherence check failed',
        violations: [{
          type: 'coherence_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check structural coherence
   */
  private async checkStructuralCoherence(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.8;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Check sentence structure and paragraph flow (simplified)
      const structuralIssues = this.checkStructuralIssues(outputText);
      
      if (structuralIssues.length > 0) {
        score = Math.max(0, 1.0 - (structuralIssues.length * 0.1));
        
        for (const issue of structuralIssues) {
          violations.push({
            type: 'structural_issue',
            severity: 'low',
            message: issue.message,
            data: issue,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.7,
        message: structuralIssues.length === 0 ? 'Structural coherence check passed' : `${structuralIssues.length} structural issues found`,
        violations,
        details: {
          structuralIssues: structuralIssues.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Structural coherence check failed',
        violations: [{
          type: 'structural_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check topic relevance
   */
  private async checkTopicRelevance(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.7;
    
    try {
      const inputText = typeof input === 'string' ? input : JSON.stringify(input);
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Extract topics from input and output
      const inputTopics = this.extractTopics(inputText);
      const outputTopics = this.extractTopics(outputText);
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(inputTopics, outputTopics);
      
      score = relevanceScore;
      
      if (relevanceScore < 0.6) {
        violations.push({
          type: 'low_relevance',
          severity: 'medium',
          message: 'Output shows low relevance to input topic',
          data: { relevanceScore, inputTopics, outputTopics },
        });
      }

      return {
        score,
        confidence,
        passed: score >= 0.6,
        message: `Topic relevance score: ${relevanceScore.toFixed(2)}`,
        violations,
        details: {
          relevanceScore,
          inputTopics: inputTopics.length,
          outputTopics: outputTopics.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Topic relevance check failed',
        violations: [{
          type: 'relevance_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check content safety
   */
  private async checkContentSafety(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.9;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Check for unsafe content (simplified)
      const safetyIssues = this.checkSafetyIssues(outputText);
      
      if (safetyIssues.length > 0) {
        score = 0;
        
        for (const issue of safetyIssues) {
          violations.push({
            type: 'safety_issue',
            severity: 'critical',
            message: issue.message,
            data: issue,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.9,
        message: safetyIssues.length === 0 ? 'Content safety check passed' : `${safetyIssues.length} safety issues found`,
        violations,
        details: {
          safetyIssues: safetyIssues.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Content safety check failed',
        violations: [{
          type: 'safety_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Check for bias
   */
  private async checkBias(input: any, output: any, context: HallucinationContext, config: any): Promise<any> {
    const violations: HallucinationViolation[] = [];
    let score = 1.0;
    let confidence = 0.8;
    
    try {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output);
      
      // Check for bias (simplified)
      const biasIssues = this.checkBiasIssues(outputText);
      
      if (biasIssues.length > 0) {
        score = Math.max(0, 1.0 - (biasIssues.length * 0.2));
        
        for (const issue of biasIssues) {
          violations.push({
            type: 'bias_issue',
            severity: 'high',
            message: issue.message,
            data: issue,
          });
        }
      }

      return {
        score,
        confidence,
        passed: score >= 0.8,
        message: biasIssues.length === 0 ? 'Bias check passed' : `${biasIssues.length} bias issues found`,
        violations,
        details: {
          biasIssues: biasIssues.length,
        },
      };
    } catch (error) {
      return {
        score: 0,
        confidence: 0,
        passed: false,
        message: error instanceof Error ? error.message : 'Bias check failed',
        violations: [{
          type: 'bias_check_error',
          severity: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  // Utility methods (simplified implementations)

  private extractFacts(text: string): string[] {
    // Simplified fact extraction
    return text.match(/[A-Z][^.!?]*[.!?]/g) || [];
  }

  private verifyFact(fact: string, knowledgeBase: any): { verified: boolean; severity: 'low' | 'medium' | 'high' | 'critical' } {
    // Simplified fact verification
    return { verified: true, severity: 'low' };
  }

  private detectLanguage(text: string): string {
    // Simplified language detection
    if (text.includes('español') || text.includes('hola')) return 'spanish';
    if (text.includes('français') || text.includes('bonjour')) return 'french';
    return 'english';
  }

  private checkGrammarRules(text: string, rules: any): any[] {
    // Simplified grammar checking
    return [];
  }

  private findContradictions(text: string): any[] {
    // Simplified contradiction detection
    return [];
  }

  private extractDates(text: string): Date[] {
    // Simplified date extraction
    return [];
  }

  private checkTemporalConsistency(dates: Date[]): any[] {
    // Simplified temporal consistency checking
    return [];
  }

  private extractTopics(text: string): string[] {
    // Simplified topic extraction
    return text.split(' ').slice(0, 10);
  }

  private calculateCoherenceScore(topics: string[]): number {
    // Simplified coherence calculation
    return 0.8;
  }

  private checkStructuralIssues(text: string): any[] {
    // Simplified structural checking
    return [];
  }

  private calculateRelevanceScore(inputTopics: string[], outputTopics: string[]): number {
    // Simplified relevance calculation
    const intersection = inputTopics.filter(topic => outputTopics.includes(topic));
    return intersection.length / Math.max(inputTopics.length, 1);
  }

  private checkSafetyIssues(text: string): any[] {
    // Simplified safety checking
    return [];
  }

  private checkBiasIssues(text: string): any[] {
    // Simplified bias checking
    return [];
  }

  /**
   * Get hallucination check results history
   */
  getHallucinationResults(checkId: string = 'all'): HallucinationResult[] {
    return this.checkResults.get(checkId) || [];
  }

  /**
   * Get all hallucination checks
   */
  getAllHallucinationChecks(): HallucinationCheck[] {
    return Array.from(this.hallucinationChecks.values());
  }

  /**
   * Get hallucination checks by type
   */
  getHallucinationChecksByType(type: string): HallucinationCheck[] {
    return Array.from(this.hallucinationChecks.values()).filter(check => check.type === type);
  }

  /**
   * Generate hallucination report
   */
  async generateHallucinationReport(startDate?: Date, endDate?: Date): Promise<HallucinationReport> {
    const results = this.getHallucinationResults('all');
    const filteredResults = results.filter(result => {
      if (!startDate && !endDate) return true;
      if (startDate && result.timestamp < startDate) return false;
      if (endDate && result.timestamp > endDate) return false;
      return true;
    });

    const totalChecks = filteredResults.length;
    const passedChecks = filteredResults.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    const averageScore = totalChecks > 0 ? 
      filteredResults.reduce((sum, r) => sum + r.overallScore, 0) / totalChecks : 0;
    const averageConfidence = totalChecks > 0 ? 
      filteredResults.reduce((sum, r) => sum + r.overallConfidence, 0) / totalChecks : 0;

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const violations: Array<{ type: string; count: number; severity: string }> = [];
    const violationCounts: Record<string, Record<string, number>> = {};

    for (const result of filteredResults) {
      riskDistribution[result.riskLevel]++;
      
      for (const check of result.checks) {
        for (const violation of check.violations) {
          if (!violationCounts[violation.type]) {
            violationCounts[violation.type] = {};
          }
          violationCounts[violation.type][violation.severity] = 
            (violationCounts[violation.type][violation.severity] || 0) + 1;
        }
      }
    }

    for (const [type, severities] of Object.entries(violationCounts)) {
      for (const [severity, count] of Object.entries(severities)) {
        violations.push({ type, count, severity });
      }
    }

    const recommendations: string[] = [];
    if (failedChecks > totalChecks * 0.1) {
      recommendations.push('High failure rate detected - review hallucination detection thresholds');
    }
    if (riskDistribution.critical > 0) {
      recommendations.push('Critical hallucinations detected - immediate review required');
    }

    return {
      id: `hallucination_report_${Date.now()}`,
      timestamp: new Date(),
      totalChecks,
      passedChecks,
      failedChecks,
      averageScore,
      averageConfidence,
      riskDistribution,
      violations,
      recommendations,
    };
  }
}