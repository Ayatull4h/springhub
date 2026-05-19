import Image from "next/image";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const src = tone === "dark" ? "/logo-dark.png" : "/logo-light.png";
  return (
    <div className="flex items-center">
      <Image
        src={src}
        alt="SpringHub"
        width={100}
        height={28}
        className="max-h-8 w-auto object-contain transition-opacity duration-300 hover:opacity-80"
        priority
      />
    </div>
  );
}
