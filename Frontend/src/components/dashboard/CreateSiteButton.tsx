import { Plus } from "lucide-react";

type CreateSiteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function CreateSiteButton({ onClick, disabled }: CreateSiteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? "You do not have permission to create sites." : "Create site"
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      Create site
    </button>
  );
}
