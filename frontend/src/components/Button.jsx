import { Link } from "react-router";

const VARIANTS = {
  // Bouton principal : dégradé bleu avec halo
  primary:
    "text-white bg-linear-to-r from-primary to-primary-light shadow-glow hover:from-primary-dark hover:to-primary",
  // Sur fond sombre
  secondary: "text-white border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30",
  // Sur fond clair
  outline: "text-gray-900 border border-gray-300 bg-white hover:border-primary hover:text-primary",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "text-white bg-red-600 hover:bg-red-700",
};

const SIZES = {
  sm: "px-3.5 py-1.5 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-6 py-3 text-base",
};

/**
 * Bouton en pilule. Rendu en <Link> avec `to`, en <a> avec `href`, sinon en <button>.
 */
export default function Button({ to, href, variant = "primary", size = "md", className = "", children, ...props }) {
  const classes =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap " +
    "transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 " +
    `${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
