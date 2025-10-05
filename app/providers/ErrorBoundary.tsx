import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ErrorView } from '@/components/ErrorView';
import { AppError } from '@/lib/errors';

export default function ProvidersErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }: { error: AppError; retry: () => void }) => (
        <ErrorView error={error} onRetry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
