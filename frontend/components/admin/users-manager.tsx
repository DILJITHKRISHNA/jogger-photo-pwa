"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { ManagedUser } from "@/lib/types";

const MIN_PASSWORD = 8;

function errMsg(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function UsersManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    try {
      setUsers(await apiFetch<ManagedUser[]>("/users"));
    } catch (error) {
      toast.error(errMsg(error, "Couldn't load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function replaceUser(updated: ManagedUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const user = await apiFetch<ManagedUser>("/users", {
        method: "POST",
        body: { email, password },
      });
      setUsers((prev) => [user, ...prev]);
      setEmail("");
      setPassword("");
      toast.success(`Created ${user.email}`);
    } catch (error) {
      toast.error(errMsg(error, "Couldn't create user"));
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: ManagedUser) {
    setBusyId(user.id);
    try {
      const updated = await apiFetch<ManagedUser>(`/users/${user.id}`, {
        method: "PATCH",
        body: { active: !user.active },
      });
      replaceUser(updated);
      toast.success(`${updated.email} ${updated.active ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error(errMsg(error, "Update failed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    try {
      await apiFetch<ManagedUser>(`/users/${resetTarget.id}`, {
        method: "PATCH",
        body: { password: newPassword },
      });
      toast.success(`Password updated for ${resetTarget.email}`);
      setResetTarget(null);
      setNewPassword("");
    } catch (error) {
      toast.error(errMsg(error, "Couldn't update password"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="new-user-email">Email</Label>
          <Input
            id="new-user-email"
            type="email"
            autoComplete="off"
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="new-user-password">Password</Label>
          <Input
            id="new-user-password"
            type="text"
            autoComplete="off"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            minLength={MIN_PASSWORD}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={creating} className="h-8 shrink-0">
          {creating ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Create user
        </Button>
      </form>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {users.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setResetTarget(user);
                      setNewPassword("");
                    }}
                  >
                    <KeyRound />
                    Password
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.active}
                      disabled={busyId === user.id}
                      onCheckedChange={() => handleToggleActive(user)}
                      aria-label={user.active ? "Deactivate user" : "Activate user"}
                    />
                    <span className="w-20 text-xs text-muted-foreground">
                      {user.active ? "Deactivate" : "Activate"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Set a new password</DialogTitle>
              <DialogDescription>
                For {resetTarget?.email}. They will be signed out and must use the new password.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="text"
              autoComplete="off"
              autoFocus
              placeholder={`At least ${MIN_PASSWORD} characters`}
              minLength={MIN_PASSWORD}
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={busyId === resetTarget?.id}>
                {busyId === resetTarget?.id && <Loader2 className="animate-spin" />}
                Save password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
