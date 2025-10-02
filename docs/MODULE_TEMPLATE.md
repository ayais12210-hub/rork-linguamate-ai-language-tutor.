# Module Template

## Overview

This document provides a template for creating new feature modules in Linguamate. Every module follows a consistent structure with clear separation of concerns.

## Module Structure

```
modules/<feature>/
  ui/                       # Screens and feature-specific components
    <Feature>Screen.tsx     # Main screen component
    components/             # Feature-specific UI components
      <Component>.tsx
    index.ts                # Barrel export
  data/                     # React Query hooks and tRPC calls
    <feature>.queries.ts    # Query hooks
    <feature>.mutations.ts  # Mutation hooks
    index.ts
  logic/                    # Pure functions, FSMs, reducers
    fsm.ts                  # Finite state machines
    reducers.ts             # Pure reducers
    utils.ts                # Pure utility functions
    index.ts
  types/                    # TypeScript types
    <feature>.types.ts
    index.ts
  tests/                    # Co-located tests
    <feature>.screen.test.tsx
    logic.test.ts
    queries.test.ts
    index.ts
  index.ts                  # Top-level barrel export
```

## Step-by-Step Guide

### 1. Create Folder Structure

```bash
mkdir -p modules/<feature>/{ui,data,logic,types,tests}
touch modules/<feature>/ui/index.ts
touch modules/<feature>/data/index.ts
touch modules/<feature>/logic/index.ts
touch modules/<feature>/types/index.ts
touch modules/<feature>/tests/index.ts
touch modules/<feature>/index.ts
```

### 2. Define Types

```typescript
// modules/<feature>/types/<feature>.types.ts
export interface <Feature>State {
  isLoading: boolean;
  error: string | null;
  data: <Feature>Data | null;
}

export interface <Feature>Data {
  id: string;
  // ... other fields
}

export type <Feature>Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: <Feature>Data }
  | { type: 'LOAD_ERROR'; error: string };
```

```typescript
// modules/<feature>/types/index.ts
export * from './<feature>.types';
```

### 3. Create Logic Layer

```typescript
// modules/<feature>/logic/fsm.ts
import type { <Feature>State, <Feature>Action } from '../types';

export const initialState: <Feature>State = {
  isLoading: false,
  error: null,
  data: null,
};

export function <feature>Reducer(
  state: <Feature>State,
  action: <Feature>Action
): <Feature>State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, data: action.payload };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.error };
    default:
      return state;
  }
}
```

```typescript
// modules/<feature>/logic/utils.ts
export function calculate<Feature>Score(data: unknown): number {
  // Pure function logic
  return 0;
}

export function validate<Feature>Input(input: string): boolean {
  // Pure validation logic
  return true;
}
```

```typescript
// modules/<feature>/logic/index.ts
export * from './fsm';
export * from './utils';
```

### 4. Create Data Layer

```typescript
// modules/<feature>/data/<feature>.queries.ts
import { useQuery } from '@tanstack/react-query';
import { trpcClient } from '@lib/trpc';
import type { <Feature>Data } from '../types';

export function use<Feature>Query(id: string) {
  return useQuery({
    queryKey: ['<feature>', id],
    queryFn: async () => {
      const data = await trpcClient.<feature>.getById.query({ id });
      return data as <Feature>Data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function use<Feature>ListQuery() {
  return useQuery({
    queryKey: ['<feature>', 'list'],
    queryFn: async () => {
      const data = await trpcClient.<feature>.getAll.query();
      return data as <Feature>Data[];
    },
  });
}
```

```typescript
// modules/<feature>/data/<feature>.mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '@lib/trpc';
import type { <Feature>Data } from '../types';

export function useCreate<Feature>Mutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Partial<<Feature>Data>) => {
      return await trpcClient.<feature>.create.mutate(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['<feature>'] });
    },
  });
}

export function useUpdate<Feature>Mutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<<Feature>Data> }) => {
      return await trpcClient.<feature>.update.mutate({ id, data });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['<feature>', variables.id] });
    },
  });
}
```

```typescript
// modules/<feature>/data/index.ts
export * from './<feature>.queries';
export * from './<feature>.mutations';
```

### 5. Create UI Layer

```typescript
// modules/<feature>/ui/<Feature>Screen.tsx
import React, { useReducer } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { use<Feature>Query } from '../data';
import { <feature>Reducer, initialState } from '../logic';
import type { <Feature>Data } from '../types';

export default function <Feature>Screen() {
  const [state, dispatch] = useReducer(<feature>Reducer, initialState);
  const query = use<Feature>Query('example-id');
  
  if (query.isLoading) {
    return (
      <View style={styles.container} testID="<feature>-screen-loading">
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (query.error) {
    return (
      <View style={styles.container} testID="<feature>-screen-error">
        <Text style={styles.errorText}>Error: {query.error.message}</Text>
        <TouchableOpacity onPress={() => query.refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container} testID="<feature>-screen">
      <Text style={styles.title}><Feature> Screen</Text>
      {/* Feature content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
  },
});
```

```typescript
// modules/<feature>/ui/index.ts
export { default as <Feature>Screen } from './<Feature>Screen';
```

### 6. Create Tests

```typescript
// modules/<feature>/tests/<feature>.screen.test.tsx
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/utils/render';
import <Feature>Screen from '../ui/<Feature>Screen';

describe('<Feature>Screen', () => {
  it('renders loading state', () => {
    renderWithProviders(<<Feature>Screen />);
    expect(screen.getByTestId('<feature>-screen-loading')).toBeInTheDocument();
  });
  
  it('renders error state', async () => {
    // Mock error
    renderWithProviders(<<Feature>Screen />);
    // Wait for error
    expect(await screen.findByTestId('<feature>-screen-error')).toBeInTheDocument();
  });
  
  it('renders success state', async () => {
    // Mock success
    renderWithProviders(<<Feature>Screen />);
    expect(await screen.findByTestId('<feature>-screen')).toBeInTheDocument();
  });
});
```

```typescript
// modules/<feature>/tests/logic.test.ts
import { <feature>Reducer, initialState } from '../logic/fsm';
import { calculate<Feature>Score } from '../logic/utils';

describe('<feature>Reducer', () => {
  it('handles LOAD_START action', () => {
    const state = <feature>Reducer(initialState, { type: 'LOAD_START' });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('handles LOAD_SUCCESS action', () => {
    const payload = { id: '1', /* ... */ };
    const state = <feature>Reducer(initialState, { type: 'LOAD_SUCCESS', payload });
    expect(state.isLoading).toBe(false);
    expect(state.data).toEqual(payload);
  });
  
  it('handles LOAD_ERROR action', () => {
    const state = <feature>Reducer(initialState, { type: 'LOAD_ERROR', error: 'Failed' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed');
  });
});

describe('calculate<Feature>Score', () => {
  it('calculates score correctly', () => {
    const score = calculate<Feature>Score({ /* ... */ });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
```

```typescript
// modules/<feature>/tests/queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use<Feature>Query } from '../data/<feature>.queries';

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('use<Feature>Query', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => use<Feature>Query('test-id'), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

### 7. Create Top-Level Barrel Export

```typescript
// modules/<feature>/index.ts
export * from './ui';
export * from './data';
export * from './logic';
export * from './types';
```

### 8. Create Route

```typescript
// app/(tabs)/<feature>.tsx
import React from 'react';
import { <Feature>Screen } from '@modules/<feature>';

export default function <Feature>Route() {
  return <<Feature>Screen />;
}
```

### 9. Register Route in Tab Layout

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { <Icon> } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs>
      {/* ... other tabs */}
      <Tabs.Screen
        name="<feature>"
        options={{
          title: '<Feature>',
          headerTitle: '<Feature>',
          tabBarIcon: ({ color, size }) => <<Icon> size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## Checklist

- [ ] Created folder structure: `ui/`, `data/`, `logic/`, `types/`, `tests/`
- [ ] Defined types in `types/<feature>.types.ts`
- [ ] Created FSM/reducer in `logic/fsm.ts`
- [ ] Created pure utilities in `logic/utils.ts`
- [ ] Created query hooks in `data/<feature>.queries.ts`
- [ ] Created mutation hooks in `data/<feature>.mutations.ts`
- [ ] Created screen component in `ui/<Feature>Screen.tsx`
- [ ] Added `testID="<feature>-screen"` to screen root
- [ ] Created barrel exports (`index.ts`) in all subfolders
- [ ] Created top-level barrel export `modules/<feature>/index.ts`
- [ ] Created unit tests for logic
- [ ] Created component tests for UI
- [ ] Created integration tests for data hooks
- [ ] Created route in `app/(tabs)/<feature>.tsx`
- [ ] Registered route in `app/(tabs)/_layout.tsx`
- [ ] Verified all imports use path aliases (`@modules/*`, `@lib/*`)
- [ ] Ran `npm run typecheck` and fixed errors
- [ ] Ran `npm run lint` and fixed errors
- [ ] Ran `npm run test` and verified coverage

## Example: Creating a "Vocabulary" Module

```bash
# 1. Create structure
mkdir -p modules/vocabulary/{ui,data,logic,types,tests}

# 2. Create files
touch modules/vocabulary/types/vocabulary.types.ts
touch modules/vocabulary/logic/fsm.ts
touch modules/vocabulary/logic/utils.ts
touch modules/vocabulary/data/vocabulary.queries.ts
touch modules/vocabulary/data/vocabulary.mutations.ts
touch modules/vocabulary/ui/VocabularyScreen.tsx
touch modules/vocabulary/tests/vocabulary.screen.test.tsx
touch modules/vocabulary/tests/logic.test.ts
touch modules/vocabulary/tests/queries.test.ts

# 3. Create barrel exports
touch modules/vocabulary/ui/index.ts
touch modules/vocabulary/data/index.ts
touch modules/vocabulary/logic/index.ts
touch modules/vocabulary/types/index.ts
touch modules/vocabulary/tests/index.ts
touch modules/vocabulary/index.ts

# 4. Create route
touch app/(tabs)/vocabulary.tsx

# 5. Implement following the template above
```

## Tips

1. **Start with types**: Define your data structures first
2. **Keep logic pure**: Functions in `logic/` should have no side effects
3. **Test early**: Write tests as you build
4. **Use testIDs**: Add `testID` to all interactive elements
5. **Document complex logic**: Add JSDoc comments for non-obvious code
6. **Follow naming conventions**: See `docs/NAMING_CONVENTIONS.md`
7. **Validate data**: Use Zod schemas from `@schemas`
8. **Handle errors**: Always handle loading, error, and success states
9. **Optimize queries**: Set appropriate `staleTime` and `cacheTime`
10. **Keep screens thin**: Move complex logic to `logic/` layer

## Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Naming Conventions](./NAMING_CONVENTIONS.md)
- [Schema Contracts](./SCHEMA_CONTRACTS.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
