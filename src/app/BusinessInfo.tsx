import {
  ADDRESS,
  HOURS,
  PHONE_DISPLAY,
  WHATSAPP_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MAPS_URL,
  BUSINESS_NAME,
} from "@/lib/content/business-info";

const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const IconWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01a1.09 1.09 0 00-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785a9.86 9.86 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.825 9.825 0 016.988 2.896 9.826 9.826 0 012.893 6.994c-.003 5.45-4.437 9.886-9.889 9.886m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.687 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.485-8.413" />
  </svg>
);
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 grid place-items-center text-accent shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim mb-0.5">
          {label}
        </p>
        <p className="text-sm text-foreground leading-snug break-words">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block group transition-transform hover:-translate-y-0.5"
    >
      {content}
    </a>
  );
}

export function BusinessInfo() {
  return (
    <section
      id="visitanos"
      className="relative px-6 sm:px-8 py-24 max-w-5xl mx-auto w-full"
    >
      <div className="mb-12 text-center">
        <span className="text-[11px] uppercase tracking-[0.25em] text-accent-dim">
          Visitanos
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mt-3">
          Te esperamos en{" "}
          <span className="italic font-normal text-accent">{BUSINESS_NAME}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
        <InfoRow icon={<IconPin />} label="Dirección" value={ADDRESS} href={MAPS_URL} />
        <InfoRow icon={<IconClock />} label="Horario" value={HOURS} />
        <InfoRow icon={<IconWhatsApp />} label="WhatsApp" value={PHONE_DISPLAY} href={WHATSAPP_URL} />
        <InfoRow icon={<IconInstagram />} label="Instagram" value={INSTAGRAM_HANDLE} href={INSTAGRAM_URL} />
      </div>
    </section>
  );
}
