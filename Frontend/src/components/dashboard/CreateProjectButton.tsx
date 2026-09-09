import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function CreateProjectButton() {
  return (
    <Link
      to="/projects/new"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      Create project
    </Link>
  );
}
