import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/SimpleDashboard';
import Login from './pages/ModernLogin';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

import GoogleAnalytics from './pages/GoogleAnalytics';
import GoogleAds from './pages/GoogleAds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/reports/*" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/google-analytics" element={<GoogleAnalytics />} />
                      <Route path="/google-ads" element={<GoogleAds />} />
                    </Routes>
                  </Layout>
                </AuthGuard>
              }
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;