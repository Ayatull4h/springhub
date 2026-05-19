import Image from "next/image";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const src = tone === "dark" ? "/logo-dark.svg" : "/logo-light.svg";
  return (
    <div className="flex items-center">
      <Image
        src={src}
        alt="SpringHub"
        width={130}
        height={32}
        className="h-8 w-auto transition-opacity duration-300 hover:opacity-80"
        priority
      />
    </div>
  );
}
