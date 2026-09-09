type HeaderProps = {
  title: string;
  dateLabel: string;
  actions?: React.ReactNode;
};

export function Header({ title, dateLabel, actions }: HeaderProps) {
  return (
    <div className="border-b border-white/[0.05] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {dateLabel ? (
            <p className="mt-2 text-xs font-medium tracking-wide text-white/30">
              {dateLabel}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
