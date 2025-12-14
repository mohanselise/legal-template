import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { startOfDay, subDays, startOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const last24h = subDays(now, 1);
        const last7d = subDays(now, 7);
        const last30d = subDays(now, 30);

        // Helper to get stats for a date range
        const getStats = async (startDate?: Date) => {
            const where = startDate ? { createdAt: { gte: startDate } } : {};

            const aggregations = await prisma.apiUsageLog.aggregate({
                where,
                _count: {
                    id: true,
                },
                _sum: {
                    totalTokens: true,
                    cost: true,
                },
                _avg: {
                    responseTime: true,
                },
            });

            const successCount = await prisma.apiUsageLog.count({
                where: {
                    ...where,
                    success: true,
                },
            });

            return {
                totalRequests: aggregations._count.id,
                totalTokens: aggregations._sum.totalTokens || 0,
                totalCost: aggregations._sum.cost || 0,
                avgResponseTime: Math.round(aggregations._avg.responseTime || 0),
                successRate: aggregations._count.id > 0 ? (successCount / aggregations._count.id) * 100 : 100,
            };
        };

        const [stats24h, stats7d, stats30d, statsAllTime] = await Promise.all([
            getStats(last24h),
            getStats(last7d),
            getStats(last30d),
            getStats(),
        ]);

        // Usage by template (all time)
        const usageByTemplate = await prisma.apiUsageLog.groupBy({
            by: ['templateSlug'],
            _count: {
                id: true,
            },
            _sum: {
                cost: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        // Usage by model (all time)
        const usageByModel = await prisma.apiUsageLog.groupBy({
            by: ['model'],
            _count: {
                id: true,
            },
            _sum: {
                cost: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        // Daily usage for the last 30 days (for charts)
        // Prisma doesn't support date truncation in groupBy easily with SQLite/Postgres uniformly without raw queries
        // We'll fetch the last 30 days of data and aggregate in JS for simplicity/compatibility
        // Or use a raw query if performance is a concern. For now, fetching minimal fields.
        const dailyLogs = await prisma.apiUsageLog.findMany({
            where: {
                createdAt: { gte: last30d },
            },
            select: {
                createdAt: true,
                cost: true,
                totalTokens: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const dailyStats = dailyLogs.reduce((acc, log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, requests: 0, cost: 0, tokens: 0 };
            }
            acc[date].requests++;
            acc[date].cost += log.cost;
            acc[date].tokens += log.totalTokens;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({
            summary: {
                last24h: stats24h,
                last7d: stats7d,
                last30d: stats30d,
                allTime: statsAllTime,
            },
            byTemplate: usageByTemplate.map(item => ({
                templateSlug: item.templateSlug || 'unknown',
                requests: item._count.id,
                cost: item._sum.cost || 0,
            })),
            byModel: usageByModel.map(item => ({
                model: item.model,
                requests: item._count.id,
                cost: item._sum.cost || 0,
            })),
            dailyTrends: Object.values(dailyStats),
        });
    } catch (error) {
        console.error('Error fetching analytics stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics stats' },
            { status: 500 }
        );
    }
}
