// ============================================================
// Axon v4.4 — AuthGateRouter
// Shows login/signup when not authenticated.
// Also provides access to BatchVerifier from the login screen.
// Extracted from App.tsx for modularity.
// ============================================================

import React, { useState } from 'react';
import { LoginPage } from '@/app/components/auth/LoginPage';
import { SignupPage } from '@/app/components/auth/SignupPage';
import { BatchVerifier } from '@/app/components/content/BatchVerifier';
import { Zap } from 'lucide-react';

export function AuthGateRouter() {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'batch-verify'>('login');

  if (authView === 'batch-verify') {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-white text-sm font-semibold">Axon Dev Tools</span>
          <button
            onClick={() => setAuthView('login')}
            className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition"
          >
            Back to Login
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <BatchVerifier />
        </div>
      </div>
    );
  }

  if (authView === 'signup') {
    return (
      <SignupPage
        onSwitchToLogin={() => setAuthView('login')}
        onSignupSuccess={() => {/* AuthContext updates -> AuthGuard re-renders */}}
      />
    );
  }

  return (
    <div className="relative">
      <LoginPage
        onSwitchToSignup={() => setAuthView('signup')}
        onLoginSuccess={() => {/* AuthContext updates -> AuthGuard re-renders */}}
      />
      <button
        onClick={() => setAuthView('batch-verify')}
        className="fixed bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors z-50"
      >
        <Zap size={12} />
        Batch Verify Endpoints
      </button>
    </div>
  );
}
