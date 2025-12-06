import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient, persistOptions } from './lib/queryClient'
import { outboxSync } from './services/outbox-sync.service'
import './index.css'
import App from './App.tsx'

// Component to initialize outbox sync service
function AppWithSync() {
  useEffect(() => {
    // Start outbox sync service
    outboxSync.start();

    // Cleanup on unmount
    return () => {
      outboxSync.stop();
    };
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <AppWithSync />
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  </StrictMode>,
)
