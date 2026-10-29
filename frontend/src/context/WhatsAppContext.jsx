import { createContext, useContext, useEffect, useState } from "react";

/**
 * Sujet de la conversation WhatsApp (titre du service consulté), pour pré-remplir le message
 * du bouton flottant. Une page le déclare avec useWhatsAppTopic(titre).
 */
const WhatsAppContext = createContext({ topic: null, setTopic: () => {} });

export function WhatsAppProvider({ children }) {
  const [topic, setTopic] = useState(null);
  return <WhatsAppContext value={{ topic, setTopic }}>{children}</WhatsAppContext>;
}

export const useWhatsApp = () => useContext(WhatsAppContext);

export function useWhatsAppTopic(topic) {
  const { setTopic } = useWhatsApp();
  useEffect(() => {
    setTopic(topic || null);
    return () => setTopic(null);
  }, [topic, setTopic]);
}
