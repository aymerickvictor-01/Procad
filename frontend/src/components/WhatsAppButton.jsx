import { useCompany } from "../context/CompanyContext";
import { useWhatsApp } from "../context/WhatsAppContext";
import { whatsappMessage, whatsappUrl } from "../lib/whatsapp";
import WhatsAppIcon from "./WhatsAppIcon";

/** Bouton flottant « Discuter sur WhatsApp », présent sur tout le site public. */
export default function WhatsAppButton() {
  const { company } = useCompany();
  const { topic } = useWhatsApp();
  const href = whatsappUrl(company.whatsapp, whatsappMessage(company.name, topic));
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter avec nous sur WhatsApp"
      style={{ "--delay": "900ms" }}
      className="group animate-fade-up fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-full bg-[#25d366] p-3.5 text-white shadow-[0_10px_30px_-8px_rgb(10_18_64/0.45)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe5b] sm:right-6 sm:bottom-6 sm:py-3 sm:pr-5 sm:pl-3.5"
    >
      <WhatsAppIcon className="size-7 sm:size-6" />
      <span className="hidden text-[15px] font-semibold sm:inline">Discuter sur WhatsApp</span>
    </a>
  );
}
