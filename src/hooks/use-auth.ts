"use client";

import { useUser, useStackApp } from "@stackframe/stack";

export function useAuth() {
    const user = useUser();
    const stackApp = useStackApp();

    return {
        user,
        isAuthenticated: !!user,
        isLoading: user === undefined,
        signIn: () => stackApp.redirectToSignIn(),
        signUp: () => stackApp.redirectToSignUp(),
        signOut: () => stackApp.redirectToSignOut(),
    };
}