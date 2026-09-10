import { Plus } from "lucide-react";

type CreateUserButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function CreateUserButton({ onClick, disabled }: CreateUserButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? "You do not have permission to create users." : "Create user"
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      Create user
    </button>
  );
}
