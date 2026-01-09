"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AI_Prompt from "@/src/components/console/chat/ai-prompt";
import GeminiLogo from "@/src/components/console/chat/gemini-logo";
import { Button } from "@/src/components/ui/button";
import { ChatInterface } from "@/src/components/console/chat/chat-interface";
import { LoaderThree } from "@/src/components/ui/loader";
import { useSidebar } from "@/src/components/ui/sidebar";
import { useAuth } from "@/src/context/auth-context";
import { useWorkspace } from "@/src/context/workspace-context";
import { motion } from "motion/react";
import type { ChatContextType } from "@/src/types/chat.types";

export default function ChatPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { state } = useSidebar();
    const { user } = useAuth();
    const { currentWorkspace, workspaces } = useWorkspace();

    const [chatContext, setChatContext] = useState<ChatContextType | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const sidebarWidth = state === "expanded" ? "16rem" : "3rem";
    const rightMargin = state === "expanded" ? "16rem" : "3rem";
    
    const username = user?.displayName || user?.email?.split('@')[0] || "User";

    const workspaceId = searchParams.get("workspaceId");
    const sourceItemId = searchParams.get("sourceItemId");
    const type = searchParams.get("type") as "workspace" | "link" | null;

    useEffect(() => {
        const initializeChat = async () => {
            setIsLoading(true);

            try {
                if (sourceItemId) {
                    setChatContext({
                        type: "link",
                        sourceItemId,
                        workspaceId: workspaceId || currentWorkspace?.id,
                    });
                } else if (workspaceId || currentWorkspace) {
                    setChatContext({
                        type: "workspace",
                        workspaceId: workspaceId || currentWorkspace?.id,
                    });
                } else {
                    setChatContext(null);
                }
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                setChatContext(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeChat();
    }, [workspaceId, sourceItemId, type, currentWorkspace]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderThree />
            </div>
        );
    }

    if (chatContext) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                    <ChatInterface
                        workspaceId={chatContext.workspaceId}
                        sourceItemId={chatContext.sourceItemId}
                        chatContext={chatContext}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative w-full overflow-hidden">
            <div 
                className="absolute flex flex-col items-center justify-center transition-all duration-250 ease-linear" 
                style={{ 
                    top: 'calc(50% - 160px)',
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
    );
}