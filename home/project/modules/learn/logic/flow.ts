export type Step =
  | { kind: 'ready' }
  | { kind: 'show'; idx: number }
  | { kind: 'feedback'; idx: number; correct: boolean }
  | { kind: 'done' };

export function next(state: Step, total: number): Step {
  switch (state.kind) {
    case 'ready':
      return { kind: 'show', idx: 0 };
    case 'feedback':
      return state.idx + 1 < total
        ? { kind: 'show', idx: state.idx + 1 }
        : { kind: 'done' };
    default:
      return state;
  }
}
