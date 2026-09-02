import { FEATURES } from "./landing-content";

export function FeatureSection() {
  return (
    <section className="max-w-5xl mx-auto w-full px-6 py-14 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-balance">ทำไมต้องมีระบบกลาง</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="card lift flex flex-col gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-control bg-brand-subtle text-brand-500"
            >
              <Icon className="size-5" />
            </span>
            <h3 className="font-semibold text-balance">{title}</h3>
            <p className="text-muted text-sm">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
