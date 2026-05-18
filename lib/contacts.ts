// Public contact channels for SpringHub / Jaga Semesta.

export const CONTACTS = {
  whatsapp: {
    /** International format used for tel:/wa.me URLs (no spaces, no +). */
    e164: "628112995190",
    /** Pretty format shown to humans. */
    display: "+62 811-2995-190",
    waUrl: "https://wa.me/628112995190",
    telUrl: "tel:+628112995190",
  },
  email: {
    address: "info@jagasemesta.id",
    mailto: "mailto:info@jagasemesta.id",
  },
  address: {
    city: "Jakarta",
    country: "Indonesia",
  },
  social: {
    instagram:
      "https://www.instagram.com/jagasemesta",
    youtube:
      "https://youtube.com/@jagasemesta?si=eUuyORclR8QeD97O",
    tiktok:
      "https://www.tiktok.com/@jagasemesta?_r=1&_t=ZS-95vqTV1Q0A5",
    facebook: "https://www.facebook.com/jagasemesta",
  },
} as const;
