import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { workflows, users } from '@/lib/db/schema';
import { eq, like, and, or, desc, asc, count } from 'drizzle-orm';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const priceFilter = searchParams.get('price') || '';
        const sortBy = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        let db;
        try {
            db = getDB();
        } catch (dbError) {
            console.error('Database connection failed:', dbError);
            return NextResponse.json({
                success: false,
                error: 'Database connection failed',
                workflows: [],
                featured: [],
                pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
                stats: { totalWorkflows: 0, totalDownloads: 0, freeWorkflows: 0 }
            });
        }

        // Build where conditions
        const conditions = [];
        
        if (search) {
            conditions.push(
                or(
                    like(workflows.title, `%${search}%`),
                    like(workflows.description, `%${search}%`),
                    like(workflows.tags, `%${search}%`)
                )
            );
        }

        if (category && category !== 'all') {
            conditions.push(eq(workflows.categoryId, category));
        }

        if (priceFilter === 'free') {
            conditions.push(eq(workflows.isPaid, false));
        } else if (priceFilter === 'paid') {
            conditions.push(eq(workflows.isPaid, true));
        }

        // Add public workflows filter
        conditions.push(eq(workflows.isPrivate, false));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Determine sort order
        let orderBy;
        switch (sortBy) {
            case 'popular':
                orderBy = desc(workflows.viewCount);
                break;
            case 'downloads':
                orderBy = desc(workflows.downloadCount);
                break;
            case 'oldest':
                orderBy = asc(workflows.createdAt);
                break;
            default: // newest
                orderBy = desc(workflows.createdAt);
                break;
        }

        // Get workflows with pagination
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
                posterImage: workflows.posterImage,
                tags: workflows.tags,
                categoryId: workflows.categoryId,
                userName: users.name,
                userEmail: users.email,
                userAvatar: users.avatar,
            })
            .from(workflows)
            .leftJoin(users, eq(workflows.userId, users.id))
            .where(whereClause)
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const [{ total }] = await db
            .select({ total: count() })
            .from(workflows)
            .where(whereClause);

        // Get featured workflows (top 3 by view count)
        const featuredWorkflows = await db
            .select({
                id: workflows.id,
                title: workflows.title,
                description: workflows.description,
                isPaid: workflows.isPaid,
                price: workflows.price,
                viewCount: workflows.viewCount,
                downloadCount: workflows.downloadCount,
                coverImage: workflows.coverImage,
                posterImage: workflows.posterImage,
                userName: users.name,
                userEmail: users.email,
            })
            .from(workflows)
            .leftJoin(users, eq(workflows.userId, users.id))
            .where(eq(workflows.isPrivate, false))
            .orderBy(desc(workflows.viewCount))
            .limit(3);

        return NextResponse.json({
            success: true,
            workflows: allWorkflows,
            featured: featuredWorkflows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
            stats: {
                totalWorkflows: total,
                totalDownloads: allWorkflows.reduce((sum, w) => sum + w.downloadCount, 0),
                freeWorkflows: allWorkflows.filter(w => !w.isPaid).length,
            }
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch workflows' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let title, description, coverImage, posterImage, youtubeUrl, screenshots, demoImages, 
            jsonContent, jsonUrl, isPaid, isPrivate, price, categoryId, tags, howItWorks, stepByStep, userId;

        if (contentType.includes('application/json')) {
            // Handle JSON payload
            const body = await request.json();
            title = body.title;
            description = body.description;
            coverImage = body.coverImage;
            posterImage = body.posterImage;
            youtubeUrl = body.youtubeUrl;
            screenshots = body.screenshots;
            demoImages = body.demoImages;
            jsonContent = body.jsonContent;
            jsonUrl = body.jsonUrl;
            isPaid = body.isPaid === true || body.isPaid === "true";
            isPrivate = body.isPrivate === true || body.isPrivate === "true";
            price = isPaid ? parseFloat(body.price) || 0 : null;
            categoryId = body.categoryId;
            tags = body.tags;
            howItWorks = body.howItWorks;
            stepByStep = body.stepByStep;
            userId = body.userId;
        } else {
            // Handle FormData payload
            const formData = await request.formData();
            title = formData.get("title") as string;
            description = formData.get("description") as string;
            coverImage = formData.get("coverImage") as string;
            posterImage = formData.get("posterImage") as string;
            youtubeUrl = formData.get("youtubeUrl") as string;
            screenshots = formData.get("screenshots") as string;
            demoImages = formData.get("demoImages") as string;
            jsonContent = formData.get("jsonContent") as string;
            jsonUrl = formData.get("jsonUrl") as string;
            isPaid = formData.get("isPaid") === "true";
            isPrivate = formData.get("isPrivate") === "true";
            price = isPaid ? parseFloat(formData.get("price") as string) || 0 : null;
            categoryId = formData.get("categoryId") as string;
            tags = formData.get("tags") as string;
            howItWorks = formData.get("howItWorks") as string;
            stepByStep = formData.get("stepByStep") as string;
            userId = formData.get("userId") as string;
        }

        // Validation
        if (!title?.trim()) {
            return NextResponse.json(
                { success: false, error: "Title is required" },
                { status: 400 }
            );
        }

        if (!description?.trim()) {
            return NextResponse.json(
                { success: false, error: "Description is required" },
                { status: 400 }
            );
        }

        if (!jsonContent?.trim() && !jsonUrl?.trim()) {
            return NextResponse.json(
                { success: false, error: "Either JSON content or JSON URL is required" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User authentication required" },
                { status: 401 }
            );
        }

        // Validate JSON format if content is provided
        if (jsonContent?.trim()) {
            try {
                JSON.parse(jsonContent);
            } catch (error) {
                console.error('Invalid JSON format:', error);
                return NextResponse.json(
                    { success: false, error: "Invalid JSON format. Please check your workflow JSON." },
                    { status: 400 }
                );
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
                userId,
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

        return NextResponse.json({
            success: true,
            workflow: newWorkflow,
            message: "Workflow created successfully"
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create workflow' },
            { status: 500 }
        );
    }
}