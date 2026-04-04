type StatusItem = {
  description: string;
  label: string;
  ready: boolean;
};

type SetupStatusProps = {
  status: readonly StatusItem[];
};

export function SetupStatus({ status }: SetupStatusProps) {
  return (
    <section className="rounded-[1.75rem] border border-border-soft bg-white/72 p-6 sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        Environment checklist
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight">
        What is wired and what still needs attention
      </h2>

      <div className="mt-6 space-y-4">
        {status.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-border-soft bg-surface-strong px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-foreground">{item.label}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                  item.ready ? "bg-green-100 text-success" : "bg-amber-100 text-warning"
                }`}
              >
                {item.ready ? "Ready" : "Needs setup"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
