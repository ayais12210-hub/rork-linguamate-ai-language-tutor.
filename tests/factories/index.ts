export * from './user';
export * from './lesson';

// Additional factory functions
import { makeUser } from './user';

export function makeUserProfile(overrides: Partial<any> = {}) {
  return makeUser(overrides);
}