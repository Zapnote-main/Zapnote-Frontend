import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion'
import Link from 'next/link'
import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@/src/hooks/use-gsap'

export default function FAQsTwo() {

    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const accordionRef = useRef<HTMLDivElement>(null)

    const faqItems = [
        {
            id: 'item-1',
            question: 'What is Zapnote?',
            answer: 'Zapnote is an all-in-one platform designed to help you store, organize, and manage your knowledge bases, links, notes, and information in one convenient place.',
        },
        {
            id: 'item-2',
            question: 'How does Zapnote help with knowledge management?',
            answer: 'Zapnote allows you to create "brains" - structured knowledge bases where you can categorize and access your information efficiently, making it easier to find and utilize what you\'ve saved.',
        },
        {
            id: 'item-3',
            question: 'What types of content can I store in Zapnote?',
            answer: 'You can store links, notes, documents, articles, and any digital content you want to organize and reference later.',
        },
        {
            id: 'item-4',
            question: 'Is my data secure with Zapnote?',
            answer: 'Yes, we prioritize data security with end-to-end encryption, compliance with privacy regulations, and secure cloud storage to protect your information.',
        },
        {
            id: 'item-5',
            question: 'Can I share my knowledge bases with others?',
            answer: 'Absolutely! Zapnote enables you to share your brains with colleagues, friends, or the public to foster collaboration and knowledge sharing.',
        },
    ]

    useGSAP(() => {
        if (!sectionRef.current || !headerRef.current || !accordionRef.current) return

        gsap.registerPlugin(ScrollTrigger)

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
        <section ref={sectionRef} className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div ref={headerRef} className="mx-auto text-center">
                   <h2 className="text-4xl md:text-5xl font-bold pb-6 bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent">Frequently Asked Questions</h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">Quick and comprehensive answers to common questions about our platform, services, and features.</p>
                </div>

                <div ref={accordionRef} className="mx-auto mt-12 max-w-xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="bg-card ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0">
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border-dashed">
                                <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-base">{item.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <p className="text-center text-muted-foreground mt-6 px-8">
                        Need more information?{' '}
                        <Link
                            href="/contact"
                            target="_blank"
                            className="text-primary font-medium hover:underline">
                            Contact us
                        </Link>
                    </p>
                    
            </div>
            </div>
        </section>
    )
}