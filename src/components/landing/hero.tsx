'use client';

import { easeInOut, motion } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Pacifico } from 'next/font/google';
import { cn } from '@/src/lib/utils';
import { usePageTransition } from '@/src/hooks/use-page-transition';
import ConcentricLoader from '@/src/components/ui/concentric-loader';



const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});


export default function HeroGeometric({
  badge = 'Zapnote',
  title1 = 'All your links at',
  title2 = 'One Place',
  isNavigating = false,
}: {
  badge?: string;
  title1?: string;
  title2?: string;
  isNavigating?: boolean;
}) {
  const { navigate } = usePageTransition();

  const handleGetStarted = () => {
    navigate("/auth");
  };
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: easeInOut,
      },
    }),
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden">
      
      <div className="relative z-10 container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="border-primary/30 bg-card/50 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur-sm md:mb-12"
          >
            <img src="/zapnote-logo.svg" alt="Zapnote Logo" className="h-4 w-4" />
            <span className="text-foreground text-sm font-medium tracking-wide">
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="mx-4 mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:mb-8 md:text-8xl">
              <span className="from-foreground to-foreground/80 bg-linear-to-b bg-clip-text text-transparent">
                {title1}
              </span>
              <br />
              <span
                className={cn(
                  'from-red-500 via-primary/90 bg-linear-to-r to-accent-foreground bg-clip-text p-4 text-transparent',
                  pacifico.className,
                  'font-bold',
                )}
              >
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-muted-foreground mx-auto mb-10 max-w-xl px-4 text-base leading-relaxed sm:text-lg md:text-xl">
              Keep a track of whats going inside your head. <br />
              No jumping between apps. Stay focused stay cool.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={handleGetStarted}
                disabled={isNavigating}
                size="lg"
                className="from-primary shadow-primary/10 hover:from-primary/90 rounded-full border-none bg-linear-to-r to-primary shadow-md hover:to-primary/90 disabled:opacity-50"
              >
                {isNavigating ? (
                  <ConcentricLoader />
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
