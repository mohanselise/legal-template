"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";

interface InviteMemberFormProps {
  orgId: string;
  maxUsers: number;
}

export function InviteMemberForm({ orgId, maxUsers }: InviteMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/org/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(true);
      setEmail("");
      setRole("member");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite Member
        </CardTitle>
        <CardDescription>
          Invite a new member to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      Full access to all features
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div>
                    <p className="font-medium">Editor</p>
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      Can create and edit templates
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div>
                    <p className="font-medium">Member</p>
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      Can use templates only
                    </p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] text-sm">
              Invitation sent successfully!
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>

          <p className="text-xs text-[hsl(var(--globe-grey))] text-center">
            Organization limit: {maxUsers} members
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
