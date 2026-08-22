import {
  ADDRESS,
  HOURS,
  PHONE_DISPLAY,
  WHATSAPP_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MAPS_URL,
} from "@/lib/content/business-info";

export function BusinessInfo() {
  return (
    <section className="px-6 py-10 max-w-xl mx-auto w-full text-center">
      <h2 className="text-lg font-medium text-foreground mb-4">Visitanos</h2>
      <div className="flex flex-col gap-2 text-sm text-foreground-muted">
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
        >
          {ADDRESS}
        </a>
        <p>{HOURS}</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
        >
          {PHONE_DISPLAY}
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
        >
          {INSTAGRAM_HANDLE}
        </a>
      </div>
    </section>
  );
}
