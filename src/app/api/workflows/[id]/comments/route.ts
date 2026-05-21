import { NextRequest, NextResponse } from "next/server";
import { getDB } from '@/lib/db';
import { comments, users } from '@/lib/db/schema';
import { eq, desc, isNull, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/workflows/[id]/comments
 * Get comments for a workflow
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getDB();

        // Get all comments with user info
        const workflowComments = await db
            .select({
                id: comments.id,
                content: comments.content,
                parentId: comments.parentId,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                userId: comments.userId,
                userName: users.name,
                userEmail: users.email,
                userAvatar: users.avatar,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.workflowId, id))
            .orderBy(desc(comments.createdAt));

        // Get comment count
        const [{ total }] = await db
            .select({ total: count() })
            .from(comments)
            .where(eq(comments.workflowId, id));

        // Organize comments into threads (parent comments with their replies)
        const parentComments = workflowComments.filter(comment => !comment.parentId);
        const replies = workflowComments.filter(comment => comment.parentId);

        const threaded = parentComments.map(parent => ({
            ...parent,
            replies: replies
                .filter(reply => reply.parentId === parent.id)
                .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        }));

        return NextResponse.json({
            success: true,
            comments: threaded,
            total: total
        });
    } catch (error) {
        console.error(`Error fetching comments:`, error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/workflows/[id]/comments
 * Create a new comment
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
        const { content, parentId } = body;

        if (!content?.trim()) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }

        const db = getDB();

        // If parentId is provided, verify the parent comment exists
        if (parentId) {
            const parentComment = await db
                .select({ id: comments.id })
                .from(comments)
                .where(eq(comments.id, parentId))
                .limit(1);

            if (!parentComment.length) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 }
                );
            }
        }

        // Create new comment
        const [newComment] = await db
            .insert(comments)
            .values({
                workflowId: id,
                userId: user.id,
                content: content.trim(),
                parentId: parentId || null,
            })
            .returning();

        // Get the comment with user info
        const [commentWithUser] = await db
            .select({
                id: comments.id,
                content: comments.content,
                parentId: comments.parentId,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                userId: comments.userId,
                userName: users.name,
                userEmail: users.email,
                userAvatar: users.avatar,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.id, newComment.id))
            .limit(1);

        return NextResponse.json({
            success: true,
            comment: commentWithUser,
            message: "Comment created successfully"
        });
    } catch (error) {
        console.error(`Error creating comment:`, error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}