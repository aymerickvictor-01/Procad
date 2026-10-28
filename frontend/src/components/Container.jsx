export default function Container({ className = "", children, ...props }) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
