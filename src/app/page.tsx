"use client";

import HeroGeometric from "../components/landing/hero";
import React from "react";
import { ThemeToggleButton3 } from "../theme/toggle-theme";
import PillNav from "../components/landing/pill-nav";
import { motion , AnimatePresence } from "framer-motion";
import GeometricShapesLayer from "../components/ui/geometric-shapes";
import ConcentricLoader from "../components/ui/concentric-loader";
import { usePageTransition } from "../hooks/use-page-transition";
import Features from "../components/landing/features";
import Background from "../components/ui/background";
import { useState, useEffect } from "react";
import FAQsTwo from "../components/landing/faq";
import { Footer } from "../components/landing/footer";
import { CTA } from "../components/landing/cta";
import { useScroll, useTransform } from "motion/react";

export default function Home() {

  const {navigate, isNavigating} = usePageTransition();
  const [activeHref, setActiveHref] = useState("#home");

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const hrefMap: { [key: string]: string } = {
              home: '#home',
              features: '#features',
              faq: '#faq',
              'get-started': '#get-started'
            };
            setActiveHref(hrefMap[id] || '#home');
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

    const handleGetStarted = () => {
    navigate("/auth");
  };

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Login', href: '/auth' }
  ];

  const ref = React.useRef(null);
  const ctaRef = React.useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: ctaScrollYProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });

  const pathLengthFirst = useTransform(ctaScrollYProgress, [0.1, 0.8], [0, 1.2]);
  const pathLengthSecond = useTransform(ctaScrollYProgress, [0.1, 0.8], [0, 1.2]);
  const pathLengthThird = useTransform(ctaScrollYProgress, [0.1, 0.8], [0, 1.2]);
  const pathLengthFourth = useTransform(ctaScrollYProgress, [0.1, 0.8], [0, 1.2]);
  const pathLengthFifth = useTransform(ctaScrollYProgress, [0.1, 0.8], [0, 1.2]);

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

      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
          <Background/>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
            opacity: isNavigating ? 0 : 1,
            scale: isNavigating ? 0.98 : 1 
          }}
        transition={{ duration: 0.3 }}
      >
        <PillNav 
          items={navItems}
          activeHref={activeHref}
          className="custom-nav"
          ease="power2.easeOut"
        />
        <ThemeToggleButton3 className="fixed top-4 right-4 z-50 size-8 p-2" />
        <main className="scroll-container" ref={ref}>
          <section id="home" className="w-full overflow-hidden">
            <GeometricShapesLayer/>
            <HeroGeometric isNavigating={isNavigating} />
          </section>

          <section id="features" className= "relative z-10">
            <Features/>
          </section>

          <section id="faq" className= "relative z-10">
            <FAQsTwo/>
          </section>

          <section id="get-started" ref={ctaRef} className= "relative z-10 mb-20">
            <CTA
              pathLengths={[
                  pathLengthFirst,
                  pathLengthSecond,
                  pathLengthThird,
                  pathLengthFourth,
                  pathLengthFifth,
              ]}
              onGetStarted={handleGetStarted}
            />
          </section>

          <section id="footer" className= "relative z-10">
            <Footer/>
          </section>
      
        </main>
      </motion.div>

    </>

    
  );
}
