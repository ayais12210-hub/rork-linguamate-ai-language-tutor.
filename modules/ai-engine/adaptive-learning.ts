import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  SkillProgress, 
  MasteryLevel 
} from '@/state/learning-progress';
import type { 
  ModuleType, 
  DifficultyLevel, 
  Exercise,
  AIFeedback,
  Mistake 
} from '@/modules/types';

interface LearningPattern {
  strongAreas: ModuleType[];
  weakAreas: ModuleType[];
  preferredTime: string; // morning, afternoon, evening
  averageSessionLength: number; // in minutes
  learningSpeed: 'slow' | 'normal' | 'fast';
  mistakePatterns: MistakePattern[];
}

interface MistakePattern {
  type: string;
  frequency: number;
  lastOccurred: Date;
  context: string[];
}

interface SpacedRepetitionItem {
  id: string;
  content: string;
  interval: number; // days
  easeFactor: number;
  nextReview: Date;
  repetitions: number;
}

const STORAGE_KEYS = {
  LEARNING_PATTERNS: 'ai_learning_patterns',
  SPACED_REPETITION: 'ai_spaced_repetition',
  DAILY_REVIEWS: 'ai_daily_reviews',
};

export class AdaptiveLearningEngine {
  private static instance: AdaptiveLearningEngine;
  
  private constructor() {}
  
  static getInstance(): AdaptiveLearningEngine {
    if (!AdaptiveLearningEngine.instance) {
      AdaptiveLearningEngine.instance = new AdaptiveLearningEngine();
    }
    return AdaptiveLearningEngine.instance;
  }
  
  /**
   * Analyze user's learning patterns and identify strengths/weaknesses
   */
  async analyzeLearningPatterns(
    skills: Record<string, SkillProgress>,
    mistakes: Mistake[]
  ): Promise<LearningPattern> {
    const moduleAccuracy: Partial<Record<ModuleType, number[]>> = {};
    
    // Group skills by module type
    Object.values(skills).forEach(skill => {
      const moduleType = this.normalizeModuleType(skill.type);
      if (!moduleAccuracy[moduleType]) {
        moduleAccuracy[moduleType] = [];
      }
      moduleAccuracy[moduleType]!.push(skill.accuracy);
    });
    
    // Calculate average accuracy per module
    const moduleAverages = Object.entries(moduleAccuracy).map(([type, accuracies]) => ({
      type: type as ModuleType,
      average: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
    }));
    
    // Identify strong and weak areas
    const strongAreas = moduleAverages
      .filter(m => m.average >= 0.8)
      .map(m => m.type);
    
    const weakAreas = moduleAverages
      .filter(m => m.average < 0.6)
      .map(m => m.type);
    
    // Analyze mistake patterns
    const mistakePatterns = this.analyzeMistakePatterns(mistakes);
    
    // Determine learning speed based on progress rate
    const learningSpeed = this.calculateLearningSpeed(skills);
    
    const pattern: LearningPattern = {
      strongAreas,
      weakAreas,
      preferredTime: await this.getPreferredLearningTime(),
      averageSessionLength: await this.getAverageSessionLength(),
      learningSpeed,
      mistakePatterns,
    };
    
    // Save patterns for future use
    await AsyncStorage.setItem(
      STORAGE_KEYS.LEARNING_PATTERNS,
      JSON.stringify(pattern)
    );
    
    return pattern;
  }
  
  /**
   * Generate personalized exercise recommendations
   */
  async generatePersonalizedExercises(
    moduleType: ModuleType,
    currentLevel: DifficultyLevel,
    recentMistakes: Mistake[]
  ): Promise<Exercise[]> {
    const patterns = await this.getLearningPatterns();
    const exercises: Exercise[] = [];
    
    // Focus on weak areas
    if (patterns?.weakAreas.includes(moduleType)) {
      // Add more basic exercises for weak areas
      exercises.push(...this.createReinforcementExercises(moduleType, recentMistakes));
    }
    
    // Add spaced repetition items
    const reviewItems = await this.getSpacedRepetitionItemsByModule(moduleType);
    exercises.push(...this.convertToExercises(reviewItems));
    
    // Adjust difficulty based on performance
    const adjustedDifficulty = this.adjustDifficulty(
      currentLevel,
      patterns?.learningSpeed || 'normal'
    );
    
    // Generate new exercises at appropriate difficulty
    exercises.push(...this.createNewExercises(moduleType, adjustedDifficulty));
    
    return exercises;
  }
  
  /**
   * Implement spaced repetition algorithm (SM-2)
   */
  async updateSpacedRepetition(
    itemId: string,
    quality: number // 0-5, where 5 is perfect recall
  ): Promise<SpacedRepetitionItem> {
    const items = await this.getSpacedRepetitionData();
    let item = items.find(i => i.id === itemId);
    
    if (!item) {
      item = {
        id: itemId,
        content: '',
        interval: 1,
        easeFactor: 2.5,
        nextReview: new Date(),
        repetitions: 0,
      };
    }
    
    // SM-2 Algorithm
    if (quality >= 3) {
      if (item.repetitions === 0) {
        item.interval = 1;
      } else if (item.repetitions === 1) {
        item.interval = 6;
      } else {
        item.interval = Math.round(item.interval * item.easeFactor);
      }
      item.repetitions++;
    } else {
      item.repetitions = 0;
      item.interval = 1;
    }
    
    // Update ease factor
    item.easeFactor = Math.max(
      1.3,
      item.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    
    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + item.interval);
    item.nextReview = nextReview;
    
    // Save updated data
    await this.saveSpacedRepetitionItem(item);
    
    return item;
  }
  
  /**
   * Generate AI feedback based on performance
   */
  async generateAIFeedback(
    exercises: Exercise[],
    mistakes: Mistake[]
  ): Promise<AIFeedback> {
    const correctCount = exercises.filter(e => e.isCorrect).length;
    const accuracy = (correctCount / exercises.length) * 100;
    
    // Analyze strengths
    const strengths = this.identifyStrengths(exercises);
    
    // Analyze weaknesses
    const weaknesses = this.identifyWeaknesses(mistakes);
    
    // Generate suggestions
    const suggestions = await this.generateSuggestions(weaknesses, accuracy);
    
    // Determine next steps
    const nextSteps = this.determineNextSteps(accuracy, mistakes);
    
    return {
      accuracy,
      strengths,
      weaknesses,
      suggestions,
      nextSteps,
    };
  }
  
  /**
   * Get daily personalized review set
   */
  async getDailyReviewSet(userId: string): Promise<Exercise[]> {
    const items = await this.getSpacedRepetitionData();
    const today = new Date();
    
    // Get items due for review
    const dueItems = items.filter(item => 
      new Date(item.nextReview) <= today
    );
    
    // Get weak areas for extra practice
    const patterns = await this.getLearningPatterns();
    const weakAreaExercises = patterns?.weakAreas.flatMap(area =>
      this.createReinforcementExercises(area, [])
    ) || [];
    
    // Combine and limit to reasonable daily amount
    const reviewSet = [
      ...this.convertToExercises(dueItems),
      ...weakAreaExercises,
    ].slice(0, 20); // Limit to 20 exercises per day
    
    return reviewSet;
  }
  
  // Private helper methods
  
  private analyzeMistakePatterns(mistakes: Mistake[]): MistakePattern[] {
    const patterns: Map<string, MistakePattern> = new Map();
    
    mistakes.forEach(mistake => {
      const key = this.categorizeError(mistake);
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          type: key,
          frequency: 0,
          lastOccurred: new Date(),
          context: [],
        });
      }
      
      const pattern = patterns.get(key)!;
      pattern.frequency++;
      pattern.context.push(mistake.exerciseId);
    });
    
    return Array.from(patterns.values());
  }
  
  private categorizeError(mistake: Mistake): string {
    // Simple categorization - can be enhanced with NLP
    if (mistake.userAnswer.length === 0) return 'no_answer';
    if (Math.abs(mistake.userAnswer.length - mistake.correctAnswer.length) > 3) {
      return 'length_mismatch';
    }
    // Add more sophisticated categorization
    return 'general_error';
  }
  
  private calculateLearningSpeed(skills: Record<string, SkillProgress>): 'slow' | 'normal' | 'fast' {
    const masteredCount = Object.values(skills).filter(s => s.mastery === 'mastered').length;
    const totalCount = Object.values(skills).length;
    
    if (totalCount === 0) return 'normal';
    
    const masteryRate = masteredCount / totalCount;
    
    if (masteryRate > 0.7) return 'fast';
    if (masteryRate < 0.3) return 'slow';
    return 'normal';
  }
  
  private async getPreferredLearningTime(): Promise<string> {
    // This would analyze session timestamps to determine preferred time
    // For now, return a default
    return 'morning';
  }
  
  private async getAverageSessionLength(): Promise<number> {
    // This would calculate average session length from stored data
    // For now, return a default
    return 15;
  }
  
  private adjustDifficulty(
    current: DifficultyLevel,
    speed: 'slow' | 'normal' | 'fast'
  ): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(current);
    
    if (speed === 'fast' && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    if (speed === 'slow' && currentIndex > 0) {
      return levels[currentIndex - 1];
    }
    
    return current;
  }
  
  private createReinforcementExercises(
    moduleType: ModuleType,
    mistakes: Mistake[]
  ): Exercise[] {
    // Create exercises targeting specific mistakes
    return mistakes.slice(0, 5).map((mistake, index) => ({
      id: `reinforce_${index}`,
      type: 'multiple_choice' as const,
      question: `Review: ${mistake.correctAnswer}`,
      correctAnswer: mistake.correctAnswer,
      hints: [`Remember: ${mistake.explanation || 'Focus on this pattern'}`],
    }));
  }
  
  private createNewExercises(
    moduleType: ModuleType,
    difficulty: DifficultyLevel
  ): Exercise[] {
    // Generate new exercises based on module and difficulty
    // This would typically call an AI service
    return [];
  }
  
  private convertToExercises(items: SpacedRepetitionItem[]): Exercise[] {
    return items.map(item => ({
      id: item.id,
      type: 'translation' as const,
      question: item.content,
      correctAnswer: '', // Would be populated from item data
    }));
  }
  
  private identifyStrengths(exercises: Exercise[]): string[] {
    const correctExercises = exercises.filter(e => e.isCorrect);
    const strengths: string[] = [];
    
    // Analyze patterns in correct answers
    const typeAccuracy: Record<string, number> = {};
    correctExercises.forEach(ex => {
      if (!typeAccuracy[ex.type]) typeAccuracy[ex.type] = 0;
      typeAccuracy[ex.type]++;
    });
    
    Object.entries(typeAccuracy).forEach(([type, count]) => {
      const total = exercises.filter(e => e.type === type).length;
      if (total > 0 && count / total > 0.8) {
        strengths.push(`Excellent at ${type} exercises`);
      }
    });
    
    return strengths;
  }
  
  private identifyWeaknesses(mistakes: Mistake[]): string[] {
    const patterns = this.analyzeMistakePatterns(mistakes);
    return patterns
      .filter(p => p.frequency > 2)
      .map(p => `Struggling with ${p.type.replace('_', ' ')}`);
  }
  
  private async generateSuggestions(
    weaknesses: string[],
    accuracy: number
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (accuracy < 60) {
      suggestions.push('Review basic concepts before advancing');
      suggestions.push('Try shorter practice sessions more frequently');
    }
    
    if (weaknesses.length > 0) {
      suggestions.push('Focus on your weak areas with targeted practice');
      suggestions.push('Use hints when available to understand patterns');
    }
    
    if (accuracy > 80) {
      suggestions.push('Great progress! Try more challenging exercises');
      suggestions.push('Help reinforce learning by teaching others');
    }
    
    return suggestions;
  }
  
  private determineNextSteps(accuracy: number, mistakes: Mistake[]): string[] {
    const steps: string[] = [];
    
    if (accuracy < 70) {
      steps.push('Review previous lessons');
      steps.push('Practice with easier exercises');
    } else if (accuracy > 90) {
      steps.push('Move to the next difficulty level');
      steps.push('Try speed challenges');
    } else {
      steps.push('Continue with current level');
      steps.push('Focus on consistency');
    }
    
    if (mistakes.length > 5) {
      steps.push('Review your mistakes carefully');
    }
    
    return steps;
  }
  
  // Utility to align SkillProgress.type (some singular) to ModuleType (pluralized)
  private normalizeModuleType(input: string): ModuleType {
    switch (input) {
      case 'alphabet':
        return 'alphabet';
      case 'number':
      case 'numbers':
        return 'numbers';
      case 'vowel':
      case 'vowels':
        return 'vowels';
      case 'consonant':
      case 'consonants':
        return 'consonants';
      case 'syllable':
      case 'syllables':
        return 'syllables';
      case 'grammar':
        return 'grammar';
      case 'sentence':
      case 'word':
        return 'sentence';
      case 'dialogue':
        return 'dialogue';
      case 'pronunciation':
        return 'pronunciation';
      case 'culture':
        return 'culture';
      default:
        return 'grammar';
    }
  }
  
  // Storage helpers
  
  private async getLearningPatterns(): Promise<LearningPattern | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_PATTERNS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private async getSpacedRepetitionData(): Promise<SpacedRepetitionItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SPACED_REPETITION);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  private async getSpacedRepetitionItemsByModule(moduleType: ModuleType): Promise<SpacedRepetitionItem[]> {
    const items = await this.getSpacedRepetitionData();
    // Filter items by module type (assuming id contains module type)
    return items.filter(item => item.id.includes(moduleType));
  }

  private async saveSpacedRepetitionItem(item: SpacedRepetitionItem): Promise<void> {
    const items = await this.getSpacedRepetitionData();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SPACED_REPETITION,
      JSON.stringify(items)
    );
  }
}