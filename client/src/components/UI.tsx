import type { ReactNode } from "react";

export function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}

export function Panel(props: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

export function Tag(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium">
      {props.children}
    </span>
  );
}
