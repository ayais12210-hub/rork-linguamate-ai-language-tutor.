import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
