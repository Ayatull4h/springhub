"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  color: string;
  count: number;
};

type MapType = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  count: number;
  categories: Category[];
};

type MapFilterProps = {
  selectedType: string;
  selectedCategory: string;
  onTypeChange: (type: string) => void;
  onCategoryChange: (category: string) => void;
};

export function MapFilter({ selectedType, selectedCategory, onTypeChange, onCategoryChange }: MapFilterProps) {
  const [types, setTypes] = useState<MapType[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/map-points/types")
      .then((r) => r.json())
      .then((data) => setTypes(data.types || []))
      .catch(() => {});
  }, []);

  // Flatten for dropdown: "semua", per type, per category
  const options: { value: string; label: string; color?: string; indent: boolean }[] = [
    { value: "", label: "Semua Titik", indent: false },
  ];

  for (const t of types) {
    options.push({ value: `type:${t.slug}`, label: `◆ ${t.name} (${t.count})`, indent: false });
    for (const c of t.categories) {
      if (c.count > 0) {
        options.push({
          value: `cat:${t.slug}:${c.slug}`,
          label: `  ${c.name} (${c.count})`,
          color: c.color,
          indent: true,
        });
      }
    }
  }

  const selectedLabel = options.find(
    (o) => o.value === `type:${selectedType}` || o.value === `cat:${selectedType}:${selectedCategory}`
  )?.label || "Semua Titik";

  return (
    <div className="relative z-[999]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-ink-line bg-white px-3 py-2 text-sm text-ink shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <span className="min-w-[120px] text-left">{selectedLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[999] mt-1 w-64 rounded-lg border border-ink-line bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (opt.value === "") {
                    onTypeChange("");
                    onCategoryChange("");
                  } else if (opt.value.startsWith("type:")) {
                    onTypeChange(opt.value.replace("type:", ""));
                    onCategoryChange("");
                  } else if (opt.value.startsWith("cat:")) {
                    const parts = opt.value.replace("cat:", "").split(":");
                    onTypeChange(parts[0]);
                    onCategoryChange(parts[1]);
                  }
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  opt.value === "" && !selectedType
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : opt.value === `type:${selectedType}` && !selectedCategory
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : opt.value === `cat:${selectedType}:${selectedCategory}`
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-ink dark:text-slate-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className={opt.indent ? "ml-4" : ""}>{opt.label}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
