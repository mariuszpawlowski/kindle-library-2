import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const { runWithAmplifyServerContext } = createServerRunner({
    config: {
        Auth: {
            Cognito: {
                userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
                userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
            }
        }
    }
});

export async function checkAuth() {
    try {
        const session = await runWithAmplifyServerContext({
            nextServerContext: { cookies },
            operation: (contextSpec) => fetchAuthSession(contextSpec)
        });

        return session.tokens !== undefined;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
