import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const p = new PrismaClient({ adapter });

async function main() {
  const videos = await p.contentBlock.findMany({ where: { type: "video" } });
  console.log("Videos found:", videos.length);

  for (const v of videos) {
    const url = v.linkUrl;
    let videoId = "";

    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    if (videoId) {
      const ytThumb = "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg";
      await p.contentBlock.update({
        where: { id: v.id },
        data: { imageUrl: ytThumb },
      });
      console.log("✅", v.title, "→", ytThumb);
    } else {
      console.log("❌ No video ID found for", v.title, url);
    }
  }
  console.log("Done!");
}

main().finally(() => p.$disconnect());
