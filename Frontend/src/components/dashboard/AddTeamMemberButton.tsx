import { Plus } from "lucide-react";

type AddTeamMemberButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function AddTeamMemberButton({
  onClick,
  disabled,
}: AddTeamMemberButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? "You do not have permission to add team members."
          : "Add team member"
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      Add Team Member
    </button>
  );
}
