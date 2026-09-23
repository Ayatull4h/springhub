import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
// Komponen memakai JSX runtime klasik (tanpa import React)
(globalThis as unknown as { React: typeof React }).React = React;
import {
  BambooIcon, BanyanIcon, StoneIcon, WaderIcon, PariIcon, UcengIcon, KepekIcon,
} from "../components/sections/eco-icons";
import { BkkWeave } from "../components/sections/bkk-decor";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, "../figma-export");
mkdirSync(out, { recursive: true });

const icons: Record<string, () => React.ReactElement> = {
  "bambu": BambooIcon,
  "beringin": BanyanIcon,
  "batu": StoneIcon,
  "wader": WaderIcon,
  "pari": PariIcon,
  "uceng": UcengIcon,
  "kepek": KepekIcon,
  "anyaman": BkkWeave,
};

for (const [name, Cmp] of Object.entries(icons)) {
  const inner = renderToStaticMarkup(React.createElement(Cmp));
  // Ambil viewBox dari output, bungkus ulang dengan xmlns + ukuran
  const vb = inner.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 64 64";
  const body = inner.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  writeFileSync(resolve(out, `${name}.svg`), svg);
  console.log("OK", name);
}
