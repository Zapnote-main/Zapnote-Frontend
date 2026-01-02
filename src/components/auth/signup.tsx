"use client"

import { useState } from 'react';
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import Link from 'next/link'
import { useAuth } from '@/src/context/auth-context'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signUpWithEmail, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signUpWithEmail(email, password);
            router.push('/home');
        } catch (error: unknown) {
            setError((error as Error).message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle();
            router.push('/home');
        } catch (error: unknown) {
            setError((error as Error).message || 'Google signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-transparent px-4">
            <div
                className="bg-muted h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]">
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="mx-auto block w-fit">
                            <img src="/zapnote-logo.svg" alt="Zapnote Logo" className="h-4 w-4" />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Create a Zapnote Account</h1>
                        <p className="text-sm">Welcome! Create an account to get started</p>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleEmailSignup} className="mt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="firstname"
                                    className="block text-sm">
                                    Firstname
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="firstname"
                                    id="firstname"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="lastname"
                                    className="block text-sm">
                                    Lastname
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="lastname"
                                    id="lastname"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-sm">
                                    Password
                                </Label>
                            </div>
                            <Input
                                type="password"
                                required
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input sz-md variant-mixed"
                            />
                        </div>

                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <hr className="border-dashed" />
                        <span className="text-muted-foreground text-xs">Or continue With</span>
                        <hr className="border-dashed" />
                    </div>

                    <div className="grid gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoogleSignup}
                            disabled={loading}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="0.98em"
                                height="1em"
                                viewBox="0 0 256 262">
                                <path
                                    fill="#4285f4"
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                                <path
                                    fill="#34a853"
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                                <path
                                    fill="#fbbc05"
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                                <path
                                    fill="#eb4335"
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                            </svg>
                            <span>Google</span>
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/auth/login">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </div>
        </section>
    )
}