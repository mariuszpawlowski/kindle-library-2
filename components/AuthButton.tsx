'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';

export default function AuthButton() {
    const { authStatus, signOut } = useAuthenticator(context => [context.authStatus]);

    if (authStatus === 'authenticated') {
        return (
            <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <LogOut size={20} />
                <span>Logout</span>
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
