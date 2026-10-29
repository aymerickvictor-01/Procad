/**
 * Image qui laisse le navigateur choisir la version la plus légère adaptée à l'écran.
 *
 * `variants` : versions WebP renvoyées par l'API ({"480": url, "960": url, "1600": url}).
 * L'original sert pour les grands écrans ; sa largeur se déduit des versions existantes
 * (une version n'existe que si l'original est plus large) : on retient le palier suivant.
 */
const WIDTHS = [480, 960, 1600];
const MAX_SIDE = 1920;

export function srcSet(src, variants) {
  const widths = WIDTHS.filter((width) => variants?.[width]);
  if (!src || !widths.length) return undefined;
  const originalWidth = WIDTHS[widths.length] ?? MAX_SIDE;
  return [...widths.map((width) => `${variants[width]} ${width}w`), `${src} ${originalWidth}w`].join(", ");
}

/** Versions WebP des photos de fond fournies avec le site (public/images/fonds, 480 et 960 px). */
export const staticVariants = (src) => ({
  480: src.replace(/\.jpg$/, ".w480.webp"),
  960: src.replace(/\.jpg$/, ".w960.webp"),
});

export default function ResponsiveImage({ src, variants, sizes = "100vw", alt = "", priority = false, ...props }) {
  if (!src) return null;
  return (
    <img
      src={src}
      srcSet={srcSet(src, variants)}
      sizes={variants ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      {...props}
    />
  );
}
