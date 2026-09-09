import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function CreateProjectButton() {
  return (
    <Link
      to="/projects/new"
      className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#e6740a] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#f0821a]"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
      Create Project
    </Link>
  );
}
