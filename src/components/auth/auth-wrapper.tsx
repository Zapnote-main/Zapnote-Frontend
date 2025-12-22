'use client';

import { AuthPage } from "./auth-page";
import { motion, AnimatePresence } from "framer-motion";
import ConcentricLoader from "../ui/concentric-loader";
import { usePageTransition } from "@/src/hooks/use-page-transition";

interface User {
  name: string;
  email: string;
}

interface AuthenticationWrapperProps {
  mode?: 'login' | 'register';
}

export default function AuthenticationWrapper({ mode = 'login' }: AuthenticationWrapperProps) {
  const { navigate, isNavigating } = usePageTransition();

  const handleAuthenticated = (userData: User) => {
    navigate("/dashboard");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isNavigating && (
          <motion.div
            key="loader"
            className="fixed inset-0 flex items-center justify-center bg-background z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ConcentricLoader />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ 
          opacity: isNavigating ? 0 : 1,
          scale: isNavigating ? 0.95 : 1 
        }}
        transition={{ duration: 0.3 }}
      >
        <AuthPage onAuthenticated={handleAuthenticated} mode={mode} />
      </motion.div>
    </>
  );
}