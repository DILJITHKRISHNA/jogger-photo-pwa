import {
  LayoutDashboard,
  ImagePlus,
  PackageCheck,
  Tag,
  Sparkles,
  FolderTree,
  SearchCheck,
  History,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/photos", label: "Photos", icon: ImagePlus },
  { href: "/admin/upload/master", label: "Master Excel", icon: FileSpreadsheet },
  { href: "/admin/upload/stock", label: "Stock Excel", icon: PackageCheck },
  { href: "/admin/upload/scheme", label: "Scheme Excel", icon: Tag },
  { href: "/admin/upload/new-model", label: "New Model Excel", icon: Sparkles },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/search", label: "Search / Check", icon: SearchCheck },
  { href: "/admin/import-history", label: "Import History", icon: History },
];
