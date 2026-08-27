import Link from "next/link";

type Props = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = "Volver" }: Props) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 w-10 h-10 rounded-full bg-background-elevated/80 backdrop-blur-md border border-border-strong text-foreground hover:text-accent hover:border-accent transition-all hover:scale-105 grid place-items-center shadow-lg shadow-black/40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}
