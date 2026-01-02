'use client'

import LoginPage from "./login";
import SignupPage from "./signup";
import Background from '../ui/background';
import { ThemeToggleButton3 } from '@/src/theme/toggle-theme';

interface AuthPageProps {
  mode?: 'login' | 'register';
}

export function AuthPage({ mode = 'login' }: AuthPageProps) {
  return (
    <Background>
      <ThemeToggleButton3 className="fixed top-4 right-4 z-50 size-8 p-2" />
      {mode === 'login' ? (
        <LoginPage />
      ) : (
        <SignupPage />
      )}
    </Background>

  )

}