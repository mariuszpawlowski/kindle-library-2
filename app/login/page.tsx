'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function LoginPage() {
    const router = useRouter();
    const { authStatus } = useAuthenticator(context => [context.authStatus]);

    useEffect(() => {
        if (authStatus === 'authenticated') {
            router.push('/');
        }
    }, [authStatus, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Authenticator
                socialProviders={['google']}
                hideSignUp={true} // Assuming we only want admin/pre-created users or Google SSO
            />
        </div>
    );
}
