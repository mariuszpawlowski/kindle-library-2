'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ReactNode } from 'react';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
            userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
            loginWith: {
                oauth: {
                    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
                    scopes: ['email', 'profile', 'openid'],
                    redirectSignIn: [typeof window !== 'undefined' ? window.location.origin : ''],
                    redirectSignOut: [typeof window !== 'undefined' ? window.location.origin : ''],
                    responseType: 'code',
                    providers: ['Google']
                }
            }
        }
    }
},
    ssr: true // Enable server-side rendering (cookie storage)
});

export default function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <Authenticator.Provider>
            {children}
        </Authenticator.Provider>
    );
}
