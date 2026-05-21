"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { workflows, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug } from "@/lib/slug-utils";

export async function createWorkflow(formData: FormData) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            redirect("/handler/sign-in");
        }

        // User should already be synced by getCurrentUser, but ensure it exists
        // This is now handled in the auth.ts getCurrentUser function

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const coverImage = formData.get("coverImage") as string;
        const posterImage = formData.get("posterImage") as string;
        const youtubeUrl = formData.get("youtubeUrl") as string;
        const screenshots = formData.get("screenshots") as string;
        const demoImages = formData.get("demoImages") as string;
        const jsonContent = formData.get("jsonContent") as string;
        const jsonUrl = formData.get("jsonUrl") as string;
        const isPaid = formData.get("isPaid") === "on";
        const isPrivate = formData.get("isPrivate") === "on";
        const price = isPaid ? parseFloat(formData.get("price") as string) || 0 : null;
        const categoryId = formData.get("categoryId") as string;
        const tags = formData.get("tags") as string;
        const howItWorks = formData.get("howItWorks") as string;
        const stepByStep = formData.get("stepByStep") as string;

        // Validation
        if (!title?.trim()) {
            throw new Error("Title is required");
        }

        if (!description?.trim()) {
            throw new Error("Description is required");
        }

        if (!jsonContent?.trim() && !jsonUrl?.trim()) {
            throw new Error("Either JSON content or JSON URL is required");
        }

        // Validate JSON format if content is provided
        if (jsonContent?.trim()) {
            try {
                JSON.parse(jsonContent);
            } catch (error) {
                throw new Error("Invalid JSON format. Please check your workflow JSON.");
            }
        }

        const db = getDB();
        const [newWorkflow] = await db
            .insert(workflows)
            .values({
                title: title.trim(),
                slug: await generateUniqueSlug(title.trim()),
                description: description.trim(),
                coverImage: coverImage?.trim() || null,
                posterImage: posterImage?.trim() || null,
                youtubeUrl: youtubeUrl?.trim() || null,
                screenshots: screenshots?.trim() || null,
                demoImages: demoImages?.trim() || null,
                userId: user.id,
                jsonContent: jsonContent?.trim() || null,
                jsonUrl: jsonUrl?.trim() || null,
                isPaid,
                isPrivate,
                price,
                categoryId: categoryId || null,
                tags: tags || null,
                howItWorks: howItWorks?.trim() || null,
                stepByStep: stepByStep?.trim() || null,
            })
            .returning();

        revalidatePath("/dashboard");
        revalidatePath("/workflows");
        
        redirect(`/workflows/${newWorkflow.id}`);
    } catch (error) {
        console.error("Error creating workflow:", error);
        
        // Handle redirect errors (these are not actual errors)
        if (error && typeof error === 'object' && 'digest' in error && 
            typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
            throw error; // Re-throw redirect errors
        }
        
        // Handle actual errors
        redirect("/workflows/new?error=" + encodeURIComponent((error as Error).message));
    }
}