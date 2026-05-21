import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Download, Star } from "lucide-react";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { workflows, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function WorkflowsPage() {
    // Get all workflows with user info
    const db = getDB();
    const allWorkflows = await db
        .select({
            id: workflows.id,
            title: workflows.title,
            description: workflows.description,
            isPaid: workflows.isPaid,
            price: workflows.price,
            viewCount: workflows.viewCount,
            downloadCount: workflows.downloadCount,
            createdAt: workflows.createdAt,
            coverImage: workflows.coverImage,
            userName: users.name,
            userEmail: users.email,
        })
        .from(workflows)
        .leftJoin(users, eq(workflows.userId, users.id))
        .orderBy(workflows.createdAt);

    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Browse Workflows</h1>
                    <p className="text-muted-foreground">
                        Discover and download N8N workflows created by the community
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search workflows..."
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </div>

                {/* Workflows Grid */}
                {allWorkflows.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Be the first to share your N8N workflow with the community!
                        </p>
                        <Button asChild>
                            <Link href="/workflows/new">Create First Workflow</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {allWorkflows.map((workflow: any) => (
                            <Card key={workflow.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                                {workflow.coverImage && (
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img
                                            src={workflow.coverImage}
                                            alt={`${workflow.title} poster`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="line-clamp-1">{workflow.title}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1">
                                                {workflow.description}
                                            </CardDescription>
                                        </div>
                                        {workflow.isPaid && (
                                            <Badge variant="secondary" className="ml-2">
                                                ${workflow.price}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                        <span>By {workflow.userName || workflow.userEmail}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {workflow.viewCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Download className="h-3 w-3" />
                                                {workflow.downloadCount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild className="flex-1">
                                            <Link href={`/workflows/${workflow.id}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="icon">
                                            <Star className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}