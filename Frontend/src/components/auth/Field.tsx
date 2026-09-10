type FieldProps = {
  id: string;
  label: string;
  error?: string;
  tight?: boolean;
  children: React.ReactNode;
};

export function Field({ id, label, error, tight = false, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <div className={tight ? "mt-1" : "mt-2"}>{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
