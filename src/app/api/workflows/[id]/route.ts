import { NextRequest, NextResponse } from "next/server";
import { getDB } from '@/lib/db';
import { workflows, users, ratings } from '@/lib/db/schema';
import { tags, workflowsToTags } from '@/lib/db/schema/tags';
import { eq, avg, count } from 'drizzle-orm';
import { createOrGetTags, associateTagsWithWorkflow } from '@/lib/db/tags-utils';

/**
 * GET /api/workflows/[id]
 * Retrieves a specific workflow by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getDB();

        const workflow = await db
            .select({
                id: workflows.id,
                title: workflows.title,
                description: workflows.description,
                isPaid: workflows.isPaid,
                price: workflows.price,
                viewCount: workflows.viewCount,
                downloadCount: workflows.downloadCount,
                createdAt: workflows.createdAt,
                updatedAt: workflows.updatedAt,
                howItWorks: workflows.howItWorks,
                stepByStep: workflows.stepByStep,
                jsonContent: workflows.jsonContent,
                jsonUrl: workflows.jsonUrl,
                coverImage: workflows.coverImage,
                posterImage: workflows.posterImage,
                youtubeUrl: workflows.youtubeUrl,
                screenshots: workflows.screenshots,
                demoImages: workflows.demoImages,
                tags: workflows.tags,
                categoryId: workflows.categoryId,
                isPrivate: workflows.isPrivate,
                userId: workflows.userId,
                userName: users.name,
                userEmail: users.email,
                userAvatar: users.avatar,
            })
            .from(workflows)
            .leftJoin(users, eq(workflows.userId, users.id))
            .where(eq(workflows.id, id))
            .limit(1);

        if (!workflow.length) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        // Fetch tags for this workflow
        const workflowTags = await db
            .select({
                id: tags.id,
                name: tags.name,
            })
            .from(tags)
            .innerJoin(workflowsToTags, eq(tags.id, workflowsToTags.tagId))
            .where(eq(workflowsToTags.workflowId, id));

        // Fetch rating statistics
        const [ratingStats] = await db
            .select({
                averageRating: avg(ratings.rating),
                totalRatings: count(ratings.id),
            })
            .from(ratings)
            .where(eq(ratings.workflowId, id));

        const workflowData = {
            ...workflow[0],
            workflowTags: workflowTags,
            ratingStats: {
                averageRating: ratingStats.averageRating ? Number(ratingStats.averageRating) : 0,
                totalRatings: ratingStats.totalRatings || 0,
            }
        };

        return NextResponse.json(workflowData);
    } catch (error) {
        console.error(`Error fetching workflow:`, error);
        return NextResponse.json(
            { error: "Failed to fetch workflow" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/workflows/[id]
 * Updates a specific workflow by ID
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contentType = request.headers.get('content-type') || '';
        let updateData: Record<string, unknown>;

        if (contentType.includes('application/json')) {
            updateData = await request.json();
        } else {
            // Handle FormData payload
            const formData = await request.formData();
            updateData = {};

            for (const [key, value] of formData.entries()) {
                if (key === 'isPaid' || key === 'isPrivate') {
                    updateData[key] = value === 'true';
                } else if (key === 'price') {
                    updateData[key] = value ? parseFloat(value as string) : null;
                } else {
                    updateData[key] = value as string;
                }
            }
        }

        // Remove undefined/null values and userId (shouldn't be updated)
        const cleanedData = Object.fromEntries(
            Object.entries(updateData).filter(([key, value]) =>
                value !== undefined && value !== null && value !== '' && key !== 'userId'
            )
        );

        if (Object.keys(cleanedData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        // Validate JSON format if content is provided
        if (cleanedData.jsonContent) {
            try {
                JSON.parse(cleanedData.jsonContent as string);
            } catch (error) {
                console.error('Invalid JSON format:', error);
                return NextResponse.json(
                    { error: "Invalid JSON format. Please check your workflow JSON." },
                    { status: 400 }
                );
            }
        }

        const db = getDB();

        // First check if workflow exists and get current user
        const existingWorkflow = await db
            .select({ userId: workflows.userId })
            .from(workflows)
            .where(eq(workflows.id, id))
            .limit(1);

        if (!existingWorkflow.length) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        // Handle tags separately
        const tagsData = cleanedData.tags;
        delete cleanedData.tags; // Remove from main update data

        // Add updatedAt timestamp
        cleanedData.updatedAt = new Date();

        // Update the workflow
        const [updatedWorkflow] = await db
            .update(workflows)
            .set(cleanedData)
            .where(eq(workflows.id, id))
            .returning();

        // Handle tags if provided
        if (tagsData) {
            try {
                const parsedTags = JSON.parse(tagsData as string);
                if (Array.isArray(parsedTags)) {
                    const tagIds = await createOrGetTags(parsedTags);
                    await associateTagsWithWorkflow(id, tagIds);
                }
            } catch (error) {
                console.error('Error processing tags:', error);
                // Don't fail the workflow update if tags fail
            }
        }

        return NextResponse.json({
            success: true,
            workflow: updatedWorkflow,
            message: "Workflow updated successfully"
        });
    } catch (error) {
        console.error(`Error updating workflow:`, error);
        return NextResponse.json(
            { error: "Failed to update workflow" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/workflows/[id]
 * Deletes a specific workflow by ID
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getDB();

        // First check if workflow exists
        const existingWorkflow = await db
            .select({ id: workflows.id })
            .from(workflows)
            .where(eq(workflows.id, id))
            .limit(1);

        if (!existingWorkflow.length) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        // Delete the workflow
        await db
            .delete(workflows)
            .where(eq(workflows.id, id));

        return NextResponse.json({
            success: true,
            deletedId: id,
            message: "Workflow deleted successfully"
        });
    } catch (error) {
        console.error(`Error deleting workflow:`, error);
        return NextResponse.json(
            { error: "Failed to delete workflow" },
            { status: 500 }
        );
    }
}