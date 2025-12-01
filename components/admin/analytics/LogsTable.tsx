"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Log {
    id: string;
    templateSlug: string | null;
    endpoint: string;
    model: string;
    totalTokens: number;
    cost: number;
    responseTime: number;
    success: boolean;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface LogsTableProps {
    logs: Log[];
    pagination: Pagination;
    onPageChange: (page: number) => void;
    loading?: boolean;
}

export function LogsTable({ logs, pagination, onPageChange, loading }: LogsTableProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Latency</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Template</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Latency</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        {log.templateSlug ? (
                                            <Badge variant="outline">{log.templateSlug}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{log.model}</TableCell>
                                    <TableCell>{log.totalTokens.toLocaleString()}</TableCell>
                                    <TableCell>${log.cost.toFixed(5)}</TableCell>
                                    <TableCell>{log.responseTime}ms</TableCell>
                                    <TableCell>
                                        {log.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing {logs.length} of {pagination.total} logs
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {pagination.page} of {pagination.totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
