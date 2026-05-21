import { NextRequest, NextResponse } from "next/server";
import { getDB } from '@/lib/db';
import { ratings, users } from '@/lib/db/schema';
import { eq, desc, avg, count, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/workflows/[id]/ratings
 * Get ratings and reviews for a workflow
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getDB();

        // Get all ratings with user info
        const workflowRatings = await db
            .select({
                id: ratings.id,
                rating: ratings.rating,
                review: ratings.review,
                createdAt: ratings.createdAt,
                userId: ratings.userId,
                userName: users.name,
                userEmail: users.email,
                userAvatar: users.avatar,
            })
            .from(ratings)
            .leftJoin(users, eq(ratings.userId, users.id))
            .where(eq(ratings.workflowId, id))
            .orderBy(desc(ratings.createdAt));

        // Get rating statistics
        const [stats] = await db
            .select({
                averageRating: avg(ratings.rating),
                totalRatings: count(ratings.id),
            })
            .from(ratings)
            .where(eq(ratings.workflowId, id));

        return NextResponse.json({
            success: true,
            ratings: workflowRatings,
            stats: {
                averageRating: stats.averageRating ? Number(stats.averageRating) : 0,
                totalRatings: stats.totalRatings || 0,
            }
        });
    } catch (error) {
        console.error(`Error fetching ratings:`, error);
        return NextResponse.json(
            { error: "Failed to fetch ratings" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/workflows/[id]/ratings
 * Create or update a rating for a workflow
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { rating, review } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        const db = getDB();

        // Check if user already rated this workflow
        const existingRating = await db
            .select({ id: ratings.id })
            .from(ratings)
            .where(and(eq(ratings.workflowId, id), eq(ratings.userId, user.id)))
            .limit(1);

        if (existingRating.length > 0) {
            // Update existing rating
            const [updatedRating] = await db
                .update(ratings)
                .set({
                    rating: rating,
                    review: review || null,
                    updatedAt: new Date(),
                })
                .where(eq(ratings.id, existingRating[0].id))
                .returning();

            return NextResponse.json({
                success: true,
                rating: updatedRating,
                message: "Rating updated successfully"
            });
        } else {
            // Create new rating
            const [newRating] = await db
                .insert(ratings)
                .values({
                    workflowId: id,
                    userId: user.id,
                    rating: rating,
                    review: review || null,
                })
                .returning();

            return NextResponse.json({
                success: true,
                rating: newRating,
                message: "Rating created successfully"
            });
        }
    } catch (error) {
        console.error(`Error creating/updating rating:`, error);
        return NextResponse.json(
            { error: "Failed to save rating" },
            { status: 500 }
        );
    }
}