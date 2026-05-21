import { z } from 'zod';

// Define the environment variables schema
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().min(1),

    // StackAuth
    NEXT_PUBLIC_STACK_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: z.string().min(1),
    STACK_SECRET_SERVER_KEY: z.string().min(1),

    // Add other environment variables as needed
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Function to validate and get environment variables
function getEnv() {
    // For client-side, we need to prefix with NEXT_PUBLIC_
    const isServer = typeof window === 'undefined';

    const env = {
        DATABASE_URL: process.env.DATABASE_URL || '',
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN || '',
        NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '',
        NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '',
        STACK_SECRET_SERVER_KEY: process.env.STACK_SECRET_SERVER_KEY || '',
        NODE_ENV: process.env.NODE_ENV || 'development',
    };

    try {
        // Validate the environment variables
        return envSchema.parse(env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = (error as any).errors.map((err: any) => err.path.join('.'));
            throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
        }
        throw error;
    }
}

// Export the validated environment variables
export const env = getEnv();