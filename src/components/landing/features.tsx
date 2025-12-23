"use client"

import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Brain, Share2, Users, Search } from 'lucide-react'
import { ReactNode, useRef } from 'react'
import { useGSAP } from '@/src/hooks/use-gsap'
import { gsap } from 'gsap'
import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ weight: '400', subsets: ['latin'] })

export default function Features() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const accordionRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!sectionRef.current || !headerRef.current || !accordionRef.current) return

        gsap.set(headerRef.current.children, {
            y: 30,
            opacity: 0,
            force3D: true,
        })

        gsap.set(accordionRef.current, {
            y: 40,
            opacity: 0,
            scale: 0.95,
            force3D: true,
        })

        gsap.to(headerRef.current.children, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            force3D: true,
            scrollTrigger: {
                trigger: headerRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
                once: true,
            },
        })

        gsap.to(accordionRef.current, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: "power3.out",
            force3D: true,
            scrollTrigger: {
                trigger: accordionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
                once: true,
            },
        })
    }, [])

    return (
        <section ref={sectionRef} className="md:py-32">
            <div className="@container mx-auto max-w-5xl px-6">
            <div className="text-center">
                <div ref={headerRef}>
                    <h1 className="text-4xl md:text-5xl font-bold pb-6 bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent">Built to cover your needs</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">All in one platform for storing and managing what you want to read</p>
                </div>
            </div>
                <Card ref={accordionRef} className="@min-4xl:max-w-full @min-4xl:grid-cols-4 @min-4xl:divide-x @min-4xl:divide-y-0 mx-auto mt-8 grid max-w-sm divide-y overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16">
                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Brain
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className={`mt-6 ${pacifico.className}`}>Brain Management</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Organize and manage your knowledge bases with powerful tools for structuring and accessing information.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Share2
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className={`mt-6 ${pacifico.className}`}>Share Brain</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Share your brains with colleagues, friends, or the public to foster collaboration and knowledge sharing.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Users
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className={`mt-6 ${pacifico.className}`}>Collaborate</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Work together with your team in real-time, editing and building brains collaboratively.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Search
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className={`mt-6 ${pacifico.className}`}>Research Management</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Manage your research in real-time, with instant updates and collaborative insights.</p>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] dark:opacity-50"
        />

        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
)