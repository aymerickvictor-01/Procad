/** En-tête commun des pages d'administration : titre, description, actions à droite. */
export default function AdminPage({ title, description, actions, children }) {
  return (
    <>
      <title>{`${title} — Administration`}</title>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-[15px] text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </>
  );
}
