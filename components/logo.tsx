import Image from "next/image";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const src = tone === "dark" ? "/logo-dark.png" : "/logo-light.png";
  return (
    <div className="flex items-center gap-2">
      <Image
        src={src}
        alt="SpringHub"
        width={140}
        height={40}
        className="h-auto w-auto"
        priority
      />
    </div>
  );
}
