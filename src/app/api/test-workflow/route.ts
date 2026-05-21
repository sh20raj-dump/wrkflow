import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { workflows } from '@/lib/db/schema';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // Log all form data to debug
        const formEntries: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
            formEntries[key] = value;
        }
        
        console.log('Received form data:', formEntries);
        
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const jsonContent = formData.get("jsonContent") as string;
        
        if (!title?.trim()) {
            return NextResponse.json({
                success: false,
                error: 'Title is required',
                receivedData: formEntries
            }, { status: 400 });
        }

        if (!description?.trim()) {
            return NextResponse.json({
                success: false,
                error: 'Description is required',
                receivedData: formEntries
            }, { status: 400 });
        }

        const db = getDB();
        
        const testWorkflow = {
            id: 'test-workflow-' + Date.now(),
            title: title,
            slug: await generateUniqueSlug(title),
            description: description,
            userId: 'ef0684db-79cc-448f-bdaf-d8b0954f1605', // Using existing user ID
            jsonContent: jsonContent || '{"nodes":[],"connections":[]}',
            isPaid: false,
            isPrivate: false,
            categoryId: null,
            tags: null,
            howItWorks: null,
            stepByStep: null
        };
        
        await db.insert(workflows).values(testWorkflow);
        
        return NextResponse.json({
            success: true,
            message: 'Test workflow created successfully',
            workflow: testWorkflow
        });
    } catch (error) {
        console.error('Workflow creation error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
