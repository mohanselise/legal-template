import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const pricingSchema = z.object({
    model: z.string().min(1),
    promptCostPer1k: z.number().min(0),
    completionCostPer1k: z.number().min(0),
});

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const pricing = await prisma.modelPricing.findMany({
            orderBy: {
                model: 'asc',
            },
        });

        return NextResponse.json(pricing);
    } catch (error) {
        console.error('Error fetching model pricing:', error);
        return NextResponse.json(
            { error: 'Failed to fetch model pricing' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = pricingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { model, promptCostPer1k, completionCostPer1k } = validation.data;

        const updated = await prisma.modelPricing.upsert({
            where: { model },
            update: {
                promptCostPer1k,
                completionCostPer1k,
            },
            create: {
                model,
                promptCostPer1k,
                completionCostPer1k,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating model pricing:', error);
        return NextResponse.json(
            { error: 'Failed to update model pricing' },
            { status: 500 }
        );
    }
}
