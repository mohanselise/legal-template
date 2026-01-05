"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { UsageChart } from "@/components/admin/analytics/UsageChart";
import { LogsTable } from "@/components/admin/analytics/LogsTable";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await fetch("/api/admin/analytics/stats");
            if (!res.ok) throw new Error("Failed to fetch stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load analytics stats");
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchLogs = async (page = 1) => {
        try {
            setLoadingLogs(true);
            const res = await fetch(`/api/admin/analytics/logs?page=${page}&limit=${pagination.limit}`);
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[hsl(var(--fg))] font-heading">
                        Analytics
                    </h1>
                    <p className="text-[hsl(var(--globe-grey))] mt-1">
                        View document generation and usage statistics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchLogs(pagination.page); }}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Link href="/admin/analytics/settings">
                        <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <StatsCards
                        stats={stats?.summary?.last30d || {
                            totalRequests: 0,
                            totalTokens: 0,
                            totalCost: 0,
                            avgResponseTime: 0,
                            successRate: 0,
                        }}
                        loading={loadingStats}
                    />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <UsageChart
                            data={stats?.dailyTrends || []}
                            loading={loadingStats}
                        />

                        <div className="col-span-3 space-y-4">
                            {/* We could add more charts here, e.g. usage by model pie chart */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow">
                                <div className="p-6 flex flex-col gap-4">
                                    <h3 className="font-semibold leading-none tracking-tight">Top Templates</h3>
                                    <div className="space-y-4">
                                        {loadingStats ? (
                                            <div className="space-y-2">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                                                ))}
                                            </div>
                                        ) : (
                                            stats?.byTemplate?.slice(0, 5).map((item: any) => (
                                                <div key={item.templateSlug} className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium leading-none">{item.templateSlug}</p>
                                                        <p className="text-xs text-muted-foreground">{item.requests} requests</p>
                                                    </div>
                                                    <div className="font-medium">
                                                        ${item.cost.toFixed(4)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <LogsTable
                        logs={logs}
                        pagination={pagination}
                        onPageChange={fetchLogs}
                        loading={loadingLogs}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
