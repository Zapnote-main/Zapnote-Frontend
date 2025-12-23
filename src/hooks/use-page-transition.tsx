"use client"

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";

export function usePageTransition() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navigateWithTransition = useCallback(
    (path: string, callback?: () => void) => {
      if (callback) {
        callback();
      }

      setIsLoading(true);
      router.prefetch(path);
      setTimeout(() => {
        startTransition(() => {
          router.push(path);
          setTimeout(() => {
            setIsLoading(false);
          }, 200);
        });
      }, 50);
    },
    [router]
  );

  return {
    navigate: navigateWithTransition,
    isNavigating: isLoading || isPending,
  };
}