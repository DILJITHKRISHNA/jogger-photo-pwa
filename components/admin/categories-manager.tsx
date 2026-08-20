"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, FolderPlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchJson } from "@/lib/client/fetcher";
import type { Category } from "@/types/product";

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const category = await fetchJson<Category>("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      setCategories((prev) => [...prev, category]);
      setNewName("");
      toast.success(`Added "${category.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add category");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string) {
    if (!editValue.trim()) return;
    setBusyId(id);
    try {
      const updated = await fetchJson<Category>(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue }),
      });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      toast.success("Renamed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rename failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleHidden(category: Category) {
    setBusyId(category.id);
    try {
      const updated = await fetchJson<Category>(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !category.hidden }),
      });
      setCategories((prev) => prev.map((c) => (c.id === category.id ? updated : c)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await fetchJson(`/api/admin/categories/${pendingDelete.id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      toast.success(`Deleted "${pendingDelete.name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name, e.g. Sandals"
          className="h-10"
        />
        <Button type="submit" disabled={creating || !newName.trim()} className="h-10 shrink-0">
          {creating ? <Loader2 className="animate-spin" /> : <FolderPlus />}
          Add
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category) => {
                const isEditing = editingId === category.id;
                const isBusy = busyId === category.id;
                return (
                  <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                    {isEditing ? (
                      <>
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-9 flex-1"
                        />
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => handleRename(category.id)}
                          aria-label="Save"
                        >
                          {isBusy ? <Loader2 className="animate-spin" /> : <Check />}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{category.name}</p>
                          <p className="truncate text-xs text-muted-foreground">/{category.slug}</p>
                        </div>
                        {category.hidden && <Badge variant="secondary">Hidden</Badge>}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditValue(category.name);
                          }}
                          aria-label="Rename"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleToggleHidden(category)}
                          aria-label={category.hidden ? "Show" : "Hide"}
                        >
                          {isBusy ? <Loader2 className="animate-spin" /> : category.hidden ? <Eye /> : <EyeOff />}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setPendingDelete(category)}
                          aria-label="Delete"
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{pendingDelete?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Photos already assigned to this category will become uncategorised. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={busyId === pendingDelete?.id}>
              {busyId === pendingDelete?.id && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
