/** Lien « click to chat » WhatsApp, avec un message pré-rempli. */
export function whatsappUrl(number, text = "") {
  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Message d'ouverture de la conversation, selon la page consultée. */
export function whatsappMessage(companyName, topic) {
  return topic
    ? `Bonjour ${companyName}, je vous contacte depuis votre site au sujet du service « ${topic} ».`
    : `Bonjour ${companyName}, je vous contacte depuis votre site.`;
}
