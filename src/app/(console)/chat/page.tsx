"use client";

import AI_Prompt from "@/src/components/console/chat/ai-prompt";
import GeminiLogo from "@/src/components/console/chat/gemini-logo";
import { useSidebar } from "@/src/components/ui/sidebar";
import { useAuth } from "@/src/context/auth-context";
import { motion } from "motion/react";

export default function ChatPage() {
    const { state } = useSidebar();
    const { user } = useAuth();
    const sidebarWidth = state === "expanded" ? "16rem" : "3rem";
    const rightMargin = state === "expanded" ? "16rem" : "3rem";
    
    const username = user?.displayName || user?.email?.split('@')[0] || "User";

    return (
        <div className="h-full relative w-full overflow-hidden">
            <div 
                className="absolute flex flex-col items-center justify-center transition-all duration-250 ease-linear" 
                style={{ 
                    top: 'calc(50% - 200px)',
                    left: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth})`,
                    paddingRight: rightMargin,
                }}
            >
                <div className="w-full max-w-3xl">
                    <motion.div
                        className="px-4"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.45, staggerChildren: 0.2 }}
                    >
                        <motion.div
                            className="flex items-center gap-2 pb-1"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GeminiLogo />
                            <h2 className="text-xl font-light">Hello {username}</h2>
                        </motion.div>
                        <motion.h1
                            className="text-4xl text-muted-foreground mb-2"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            Let&apos;s Dive Deep
                        </motion.h1>
                    </motion.div>
                    <AI_Prompt />
                </div>
            </div>
        </div>
    )
}