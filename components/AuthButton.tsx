'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { signOut } from 'aws-amplify/auth';
import Link from 'next/link';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
    const { authStatus } = useAuthenticator(context => [context.authStatus]);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            setIsSigningOut(true);
            await signOut();
            router.push('/');
            router.refresh(); // Force a refresh to clear any server-side cached data
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsSigningOut(false);
        }
    };

    if (authStatus === 'authenticated') {
        return (
            <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
                {isSigningOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
            </button>
        );
    }

    return (
        <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
            <LogIn size={20} />
            <span>Login</span>
        </Link>
    );
}
