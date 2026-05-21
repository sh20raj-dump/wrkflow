import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { getDB } from '@/lib/db';
import { comments, users } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { WorkflowCommentForm } from './workflow-comment-form';

interface Comment {
    id: string;
    content: string;
    parentId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    userAvatar: string | null;
    replies?: Comment[];
}

interface WorkflowCommentsServerProps {
    workflowId: string;
    currentUserId?: string;
}

export async function WorkflowCommentsServer({ workflowId, currentUserId }: WorkflowCommentsServerProps) {
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
        .where(eq(comments.workflowId, workflowId))
        .orderBy(desc(comments.createdAt));

    // Get comment count
    const [{ total }] = await db
        .select({ total: count() })
        .from(comments)
        .where(eq(comments.workflowId, workflowId));

    // Organize comments into threads (parent comments with their replies)
    const parentComments = workflowComments.filter(comment => !comment.parentId);
    const replies = workflowComments.filter(comment => comment.parentId);

    const threaded = parentComments.map(parent => ({
        ...parent,
        replies: replies
            .filter(reply => reply.parentId === parent.id)
            .sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aTime - bTime;
            })
    }));

    const formatDate = (dateString: Date | null) => {
        if (!dateString) return 'Unknown date';

        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <div className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
            <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar || ''} />
                    <AvatarFallback>
                        {(comment.userName || comment.userEmail)?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                            {comment.userName || comment.userEmail}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                        </span>
                    </div>
                    <p className="text-sm mb-2 whitespace-pre-wrap">
                        {comment.content}
                    </p>
                    {!isReply && currentUserId && (
                        <WorkflowCommentForm
                            workflowId={workflowId}
                            parentId={comment.id}
                            isReply={true}
                            isAuthenticated={!!currentUserId}
                        />
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} isReply={true} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comments
                </CardTitle>
                <CardDescription>
                    {total > 0
                        ? `${total} comment${total !== 1 ? 's' : ''}`
                        : 'No comments yet'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* New Comment Form */}
                <WorkflowCommentForm
                    workflowId={workflowId}
                    isAuthenticated={!!currentUserId}
                />

                {/* Comments List */}
                {threaded.length > 0 ? (
                    <div className="space-y-6">
                        {threaded.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}