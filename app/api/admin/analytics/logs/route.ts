import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const templateSlug = searchParams.get('templateSlug');
        const model = searchParams.get('model');
        const sessionId = searchParams.get('sessionId');
        const success = searchParams.get('success');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: Prisma.ApiUsageLogWhereInput = {};

        if (templateSlug) {
            where.templateSlug = templateSlug;
        }
        if (model) {
            where.model = model;
        }
        if (sessionId) {
            where.sessionId = sessionId;
        }
        if (success !== null) {
            where.success = success === 'true';
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [logs, total] = await Promise.all([
            prisma.apiUsageLog.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.apiUsageLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching analytics logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics logs' },
            { status: 500 }
        );
    }
}
