import type { RuleTrace } from './personas';

export type Explanation = {
  traces: RuleTrace[];
};

export function makeExplanation() {
  const traces: RuleTrace[] = [];
  return {
    add(trace: RuleTrace) {
      console.log('[Explain] add', trace);
      traces.push(trace);
    },
    build(): Explanation {
      return { traces: [...traces] };
    },
  };
}
