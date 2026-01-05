"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Users, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UsersTable } from "./users-table";
import { InviteDialog } from "./invite-dialog";
import { EditRoleDialog } from "./edit-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { UserRole } from "@/lib/auth/roles";

export interface SerializedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole | null;
  lastSignInAt: number | null;
  createdAt: number;
  imageUrl: string | null;
}

interface UsersAdminClientProps {
  locale: string;
}

export function UsersAdminClient({ locale }: UsersAdminClientProps) {
  const [users, setUsers] = useState<SerializedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle edit role
  const handleOpenEditRole = (user: SerializedUser) => {
    setSelectedUser(user);
    setEditRoleOpen(true);
  };

  const handleConfirmEditRole = async (newRole: UserRole) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user role");
    }

    toast.success("User role updated successfully");
    setSelectedUser(null);
    fetchUsers();
  };

  // Handle delete
  const handleOpenDelete = (user: SerializedUser) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }

    toast.success("User deleted successfully");
    setSelectedUser(null);
    fetchUsers();
  };

  // Handle invite
  const handleConfirmInvite = async (email: string, role: UserRole) => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to invite user");
    }

    toast.success(`Invitation sent to ${email}`);
    fetchUsers();
  };

  // Stats
  const adminCount = users.filter((u) => u.role === "admin").length;
  const editorCount = users.filter((u) => u.role === "editor").length;
  const noRoleCount = users.filter((u) => !u.role).length;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--fg))] font-heading">
            User Management
          </h1>
          <p className="text-[hsl(var(--globe-grey))] mt-1">
            Manage users and their access permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/10">
                <ShieldCheck className="size-6 text-[hsl(var(--selise-blue))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : adminCount}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--lime-green))]/10">
                <UserCog className="size-6 text-[hsl(var(--lime-green))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : editorCount}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">Editors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--globe-grey))]/10">
                <Users className="size-6 text-[hsl(var(--globe-grey))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : noRoleCount}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  No Role Assigned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <UsersTable
          users={users}
          onEditRole={handleOpenEditRole}
          onDelete={handleOpenDelete}
        />
      )}

      {/* Dialogs */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onConfirm={handleConfirmInvite}
      />

      <EditRoleDialog
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        user={selectedUser}
        onConfirm={handleConfirmEditRole}
      />

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

