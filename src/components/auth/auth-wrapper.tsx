'use client';

import { AuthPage } from "./auth-page";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderThree } from "../ui/loader";
import { usePageTransition } from "@/src/hooks/use-page-transition";

interface AuthenticationWrapperProps {
  mode?: 'login' | 'register';
}

export default function AuthenticationWrapper({ mode = 'login' }: AuthenticationWrapperProps) {
  const { navigate, isNavigating } = usePageTransition();

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
            <LoaderThree />
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
        <AuthPage mode={mode} />
      </motion.div>
    </>
  );
}