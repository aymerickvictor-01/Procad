// Icônes de marque dessinées en ligne (Lucide ne fournit plus les logos de marques).
const PATHS = {
  facebook:
    "M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2H8.2v3.2h2.6v8h3.2v-8h2.6l.4-3.2Z",
  linkedin:
    "M6.9 21H3.3V9.5h3.6V21ZM5.1 7.9a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM21 21h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9.8V9.5h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5V21Z",
  instagram:
    "M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8.1c-.1-1.5-.4-2.8-1.5-3.9S17.1 2.8 15.6 2.7c-1.5-.1-6-.1-7.5 0-1.5.1-2.8.4-3.9 1.5S2.8 6.6 2.7 8.1c-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.5.1-6 0-7.5Zm-2 9.1a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 6.7 4.9c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4A3 3 0 0 1 19 6.6c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z",
};

const LABELS = { facebook: "Facebook", linkedin: "LinkedIn", instagram: "Instagram" };

export default function SocialIcons({ company, className = "" }) {
  const links = [
    ["facebook", company.facebook_url],
    ["linkedin", company.linkedin_url],
    ["instagram", company.instagram_url],
  ].filter(([, url]) => url);

  if (!links.length) return null;
  return (
    <div className={`flex gap-2 ${className}`}>
      {links.map(([network, url]) => (
        <a
          key={network}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${LABELS[network]} (nouvel onglet)`}
          className="grid size-10 place-items-center rounded-lg border border-white/15 text-ink-secondary transition hover:border-white/40 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
            <path d={PATHS[network]} />
          </svg>
        </a>
      ))}
    </div>
  );
}
