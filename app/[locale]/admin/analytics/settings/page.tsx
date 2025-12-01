"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ModelPricing {
    id: string;
    model: string;
    promptCostPer1k: number;
    completionCostPer1k: number;
}

export default function AnalyticsSettingsPage() {
    const [pricing, setPricing] = useState<ModelPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchPricing = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/analytics/pricing");
            if (!res.ok) throw new Error("Failed to fetch pricing");
            const data = await res.json();
            setPricing(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load pricing settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    const handleSave = async (model: ModelPricing) => {
        try {
            setSaving(model.model);
            const res = await fetch("/api/admin/analytics/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: model.model,
                    promptCostPer1k: Number(model.promptCostPer1k),
                    completionCostPer1k: Number(model.completionCostPer1k),
                }),
            });

            if (!res.ok) throw new Error("Failed to update pricing");

            toast.success(`Updated pricing for ${model.model}`);
            fetchPricing(); // Refresh to get latest state
        } catch (error) {
            console.error(error);
            toast.error("Failed to update pricing");
        } finally {
            setSaving(null);
        }
    };

    const handleChange = (index: number, field: keyof ModelPricing, value: string) => {
        const newPricing = [...pricing];
        newPricing[index] = {
            ...newPricing[index],
            [field]: parseFloat(value) || 0,
        };
        setPricing(newPricing);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/analytics">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Analytics Settings</h2>
            </div>

            <div className="space-y-4">
                <div className="rounded-md border bg-card">
                    <div className="p-6">
                        <h3 className="text-lg font-medium">Model Pricing Configuration</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configure cost per 1,000 tokens for fallback cost calculation when API doesn't return cost data.
                        </p>

                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Model ID</TableHead>
                                        <TableHead>Prompt Cost ($/1k)</TableHead>
                                        <TableHead>Completion Cost ($/1k)</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pricing.map((item, index) => (
                                        <TableRow key={item.model}>
                                            <TableCell className="font-medium">{item.model}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    value={item.promptCostPer1k}
                                                    onChange={(e) => handleChange(index, "promptCostPer1k", e.target.value)}
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    value={item.completionCostPer1k}
                                                    onChange={(e) => handleChange(index, "completionCostPer1k", e.target.value)}
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(item)}
                                                    disabled={saving === item.model}
                                                >
                                                    {saving === item.model ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {pricing.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No pricing models configured. Run the seed script or add manually via API.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
