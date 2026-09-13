type HeaderProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {typeof title === "string" ? (
          <h1 className="text-lg font-medium text-fg">{title}</h1>
        ) : (
          title
        )}
        {description}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
