import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function TestProviders({ children, queryClient }: TestProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: PropsWithChildren) => (
    <TestProviders queryClient={queryClient}>{children}</TestProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

export { screen, waitFor, within, fireEvent } from '@testing-library/react';
export { renderWithProviders as render };
