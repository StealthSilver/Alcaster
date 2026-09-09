type HeaderProps = {
  title: string;
  actions?: React.ReactNode;
};

export function Header({ title, actions }: HeaderProps) {
  return (
    <div className="border-b border-edge pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium text-fg">{title}</h1>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
