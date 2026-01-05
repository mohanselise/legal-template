"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  UserCog,
  Trash2,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SerializedUser } from "./users-admin-client";

interface UsersTableProps {
  users: SerializedUser[];
  onEditRole: (user: SerializedUser) => void;
  onDelete: (user: SerializedUser) => void;
}

export function UsersTable({ users, onEditRole, onDelete }: UsersTableProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.firstName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.lastName?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserName = (user: SerializedUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[hsl(var(--globe-grey))]" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Last Sign In
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[hsl(var(--fg))]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-[hsl(var(--globe-grey))]"
                  >
                    {search
                      ? "No users found matching your search."
                      : "No users yet."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const name = getUserName(user);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10">
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt={name || user.email}
                                className="size-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="size-5 text-[hsl(var(--selise-blue))]" />
                            )}
                          </div>
                          <div>
                            {name && (
                              <p className="font-medium text-[hsl(var(--fg))]">
                                {name}
                              </p>
                            )}
                            <p
                              className={`text-sm ${
                                name
                                  ? "text-[hsl(var(--globe-grey))]"
                                  : "font-medium text-[hsl(var(--fg))]"
                              }`}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.role === "admin" ? (
                          <Badge className="bg-[hsl(var(--selise-blue))] text-white hover:bg-[hsl(var(--selise-blue))]/90">
                            <ShieldCheck className="size-3 mr-1" />
                            Admin
                          </Badge>
                        ) : user.role === "editor" ? (
                          <Badge className="bg-[hsl(var(--lime-green))] text-white hover:bg-[hsl(var(--lime-green))]/90">
                            <UserCog className="size-3 mr-1" />
                            Editor
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[hsl(var(--globe-grey))]">
                            No Role
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[hsl(var(--globe-grey))]">
                        {formatDate(user.lastSignInAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-44 p-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => onEditRole(user)}
                              >
                                <UserCog className="size-4" />
                                Change Role
                              </Button>
                              <div className="h-px bg-[hsl(var(--border))] my-1" />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                                onClick={() => onDelete(user)}
                              >
                                <Trash2 className="size-4" />
                                Delete User
                              </Button>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

