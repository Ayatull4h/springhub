import type { Plugin } from "@opencode-ai/plugin";

export default (async ({ project }) => {
  const { mkdir, appendFile } = await import("fs/promises");
  const { join } = await import("path");

  const historyDir = join(project.worktree, ".opencode", "history");
  await mkdir(historyDir, { recursive: true }).catch(() => {});

  function logFile(): string {
    const date = new Date().toISOString().split("T")[0];
    return join(historyDir, `${date}.md`);
  }

  const textBuffers: Record<string, string> = {};

  return {
    event: async ({ event }) => {
      try {
        const ts = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        const file = logFile();
        let entry = "";

        switch (event.type) {
          case "session.created": {
            const info = event.properties.info;
            entry = `\n---\n## Sesi: ${info.id}\n**Judul:** ${info.title || "(tanpa judul)"}\n**Waktu:** ${ts}\n\n`;
            break;
          }

          case "message.updated": {
            const msg = event.properties.info;
            if (msg.role === "user") {
              entry = `### 🧑 User (${ts})\n`;
              if (msg.summary?.body) entry += `${msg.summary.body}\n\n`;
            } else if (msg.role === "assistant") {
              entry = `### 🤖 Assistant (${ts})\n`;
              if (msg.error) {
                entry += `**Error:** ${msg.error.name}: ${(msg.error as any).data?.message || ""}\n`;
              }
              if ("tokens" in msg && msg.tokens) {
                entry += `- **Tokens:** ${msg.tokens.input} in / ${msg.tokens.output} out\n`;
              }
              if ("cost" in msg && typeof msg.cost === "number") {
                entry += `- **Cost:** \$${msg.cost.toFixed(6)}\n`;
              }
              entry += "\n";
            }
            break;
          }

          case "message.part.updated": {
            const part = event.properties.part;
            const delta = event.properties.delta;

            if (part.type === "text" && part.text) {
              if (delta && !textBuffers[part.id]) {
                textBuffers[part.id] = "";
              }
              if (delta) {
                textBuffers[part.id] += delta;
              } else if (textBuffers[part.id]) {
                const fullText = textBuffers[part.id];
                delete textBuffers[part.id];
                if (fullText.trim()) {
                  entry += `${fullText.trim()}\n\n`;
                }
              } else if (part.text.trim()) {
                entry += `${part.text.trim()}\n\n`;
              }
            } else if (part.type === "tool") {
              const tool = part as any;
              if (tool.state.status === "running") {
                entry = `#### 🛠 Tool: \`${tool.tool}\`\n- **Input:** \`\`\`json\n${JSON.stringify(tool.state.input, null, 2)}\n\`\`\`\n`;
              } else if (tool.state.status === "completed") {
                const output = tool.state.output || "";
                entry = `#### ✅ Tool: \`${tool.tool}\` — Selesai\n- **Output:**\n\`\`\`\n${output.substring(0, 2000)}${output.length > 2000 ? "\n...(truncated)" : ""}\n\`\`\`\n`;
              } else if (tool.state.status === "error") {
                entry = `#### ❌ Tool: \`${tool.tool}\` — Error\n- **Error:** ${tool.state.error}\n`;
              }
            } else if (part.type === "reasoning" && delta) {
              entry = `> 💭 *${delta}*\n\n`;
            }
            break;
          }

          case "file.edited": {
            entry = `#### 📝 File diubah: \`${event.properties.file}\`\n\n`;
            break;
          }

          case "session.diff": {
            entry = `#### 📊 Perubahan:\n`;
            for (const diff of event.properties.diff) {
              entry += `- \`${diff.file}\`: +${diff.additions}/-${diff.deletions}\n`;
            }
            entry += "\n";
            break;
          }

          case "session.compacted": {
            entry = `> 📦 Session di-compact pada ${ts}\n\n`;
            break;
          }
        }

        if (entry) {
          await appendFile(file, entry, "utf-8");
        }
      } catch {
        // Silent fail — jangan sampai ngerusak opencode
      }
    },
  };
}) satisfies Plugin;
