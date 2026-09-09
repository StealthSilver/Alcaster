import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function CreateSiteButton() {
  return (
    <Link
      to="/sites/new"
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
      Create Site
    </Link>
  );
}
