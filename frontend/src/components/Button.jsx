import { Link } from "react-router";

const VARIANTS = {
  primary: "text-white bg-primary shadow-glow hover:bg-primary-dark",
  // Sur fond sombre
  secondary: "text-white border border-white/30 hover:bg-white/10 hover:border-white/50",
  // Sur fond clair
  outline: "text-gray-900 border border-gray-300 bg-white hover:border-primary hover:text-primary",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "text-white bg-red-600 hover:bg-red-700",
};

const SIZES = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-6 py-3.5 text-[15px]",
};

/**
 * Bouton. Rendu en <Link> avec `to`, en <a> avec `href`, sinon en <button>.
 * Pour le masquer selon l'écran, envelopper dans un conteneur : la classe « inline-flex »
 * posée ici l'emporterait sur « hidden ».
 */
export default function Button({ to, href, variant = "primary", size = "md", className = "", children, ...props }) {
  const classes =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
    "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 " +
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
