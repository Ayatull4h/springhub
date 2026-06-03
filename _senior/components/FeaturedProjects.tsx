"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, HardHat, Heart, ThumbsUp, MessageSquare } from "lucide-react";
import { featuredProjects } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const PROJECT_ICONS: Record<string, string> = {
  spring_restoration: "\uD83D\uDCA7",
  tree_planting: "\uD83C\uDF31",
  trench_development: "\uD83D\uDEE0\uFE0F",
  monitoring_expedition: "\uD83D\uDD2D",
};

const dummyComments: Record<number, Array<{ user: string; text: string; time: string }>> = {
  0: [ // project index 0 = Restore Cibeureum Spring — 23 comments
    { user: "Budi Santoso", text: "Semoga cepat terealisasi, warga di sini sangat membutuhkan!", time: "3 hari lalu" },
    { user: "Rina W.", text: "Sudah pernah survei lokasi, potensi mata airnya besar.", time: "5 hari lalu" },
    { user: "Agus P.", text: "Siap bantu gotong royong kalau ada jadwal lapangan.", time: "1 minggu lalu" },
    { user: "Dewi L.", text: "Masyarakat sekitar mohon banget ini direstorasi.", time: "1 minggu lalu" },
    { user: "Fajar N.", text: "Saya donasi untuk proyek ini! Semangat!", time: "2 minggu lalu" },
    { user: "Sri Haryanti", text: "Cibeureum dulu jernih sekali, sekarang mulai keruh. Semoga cepat pulih.", time: "4 jam lalu" },
    { user: "Dimas Ardiansyah", text: "Aliran airnya mengecek drastis tiap kemarau, perlu tindakan segera.", time: "8 jam lalu" },
    { user: "Nurul Hidayah", text: "Warga sekitar setiap hari ambil air di sini, tolong diperbaiki infrastrukturnya.", time: "12 jam lalu" },
    { user: "Eko Prasetyo", text: "Saya bisa bantu desain teknis sistem pipa distribusi.", time: "1 hari lalu" },
    { user: "Lina Marlina", text: "Potensi debit air masih bagus kalau dikelola dengan baik.", time: "1 hari lalu" },
    { user: "Joko Susilo", text: "Sudah ada kelompok sadar lingkungan di sini, tinggal didukung.", time: "2 hari lalu" },
    { user: "Fitriani", text: "Ayo donasi! Setiap rupiah berarti buat alam.", time: "2 hari lalu" },
    { user: "Rizki Pratama", text: "Mata air ini sumber kehidupan puluhan KK, jangan sampai mati.", time: "3 hari lalu" },
    { user: "Wulan Sari", text: "Pohon di sekitar mata air banyak ditebang, perlu reboisasi juga.", time: "4 hari lalu" },
    { user: "Hendra Gunawan", text: "Semoga Pemda ikut mendukung program restorasi ini.", time: "5 hari lalu" },
    { user: "Dian Permata", text: "Survey tanah sudah kami lakukan, hasilnya positif buat restorasi.", time: "6 hari lalu" },
    { user: "Arif Budiman", text: "Siap menjadi volunteer lapangan setiap akhir pekan.", time: "1 minggu lalu" },
    { user: "Mega Wati", text: "Anak-anak di desa belajar tentang konservasi, semoga ini jadi laboratorium alam.", time: "1 minggu lalu" },
    { user: "Bayu Aji", text: "Debit air menurun 40% dalam 5 tahun terakhir, data BPDAS.", time: "1 minggu lalu" },
    { user: "Ratna Kusuma", text: "Kualitas air masih bagus di hulu, perlu dijaga dari pencemaran.", time: "1 minggu lalu" },
    { user: "Taufik Hidayat", text: "Kami siap bantu pembuatan sumur resapan di sekitar mata air.", time: "2 minggu lalu" },
    { user: "Siti Nurjanah", text: "Pengalaman restorasi di desa lain berhasil, yakin ini juga bisa!", time: "2 minggu lalu" },
    { user: "Adi Wibowo", text: "Tanah longsor di hulu bikin sedimentasi, perlu normalisasi segera.", time: "2 minggu lalu" },
  ],
  1: [ // project index 1 = Endemic Tree Planting Tabanan — 23 comments
    { user: "Maya Putri", text: "Pohon endemik sangat penting untuk ekosistem mata air.", time: "2 hari lalu" },
    { user: "Wayan S.", text: "Di Tabanan banyak mata air yang perlu dilindungi.", time: "4 hari lalu" },
    { user: "Komang A.", text: "Siap menyediakan bibit lokal dari desa saya.", time: "6 hari lalu" },
    { user: "Putu W.", text: "Lokasi strategis, semoga cepet terkumpul dananya.", time: "1 minggu lalu" },
    { user: "Made R.", text: "Program bagus! Semoga bisa diperluas ke desa lain.", time: "2 minggu lalu" },
    { user: "Gede Ariawan", text: "Bibit cempaka wangi sudah saya siapkan 200 batang.", time: "3 jam lalu" },
    { user: "Nyoman Suastini", text: "Tanaman endemik Bali seperti majegau perlu diperbanyak.", time: "6 jam lalu" },
    { user: "Ketut Pasek", text: "Areal kritis di hulu Tukad Yeh Ho sudah gundul, butuh penanaman massif.", time: "10 jam lalu" },
    { user: "Luh Gede", text: "Saya punya lahan 2 hektar, siap ditanami pohon pelindung mata air.", time: "14 jam lalu" },
    { user: "Wayan Sudarma", text: "Banjir bandang kecil makin sering karena hutan gundul.", time: "1 hari lalu" },
    { user: "Made Sutama", text: "Kelompok tani siap rawat bibit sampai 3 tahun ke depan.", time: "1 hari lalu" },
    { user: "Ni Luh Putu", text: "Semoga ada pendampingan teknis untuk jenis pohon yang tepat.", time: "2 hari lalu" },
    { user: "I Gede Suweta", text: "Subak di hilir sangat bergantung pada ketersediaan air dari hulu.", time: "2 hari lalu" },
    { user: "Komang Ayu", text: "Pulau Bali perlu lebih banyak pohon endemik, bukan pohon cepat tumbuh.", time: "3 hari lalu" },
    { user: "Putu Astawa", text: "Saya donasi bibit melalui program ini! Semakin banyak semakin baik.", time: "4 hari lalu" },
    { user: "Wayan Raka", text: "Penanaman sebaiknya di musim hujan biar bibit cepat tumbuh.", time: "5 hari lalu" },
    { user: "Nyoman Surya", text: "Dukungan dari masyarakat sekitar sudah sangat positif.", time: "6 hari lalu" },
    { user: "Ketut Suardana", text: "Kami siap jadi kader lingkungan untuk rawat pohon setiap minggu.", time: "1 minggu lalu" },
    { user: "Ni Made Wati", text: "Anak-anak sekolah siap ikut kegiatan penanaman, edukasi penting!", time: "1 minggu lalu" },
    { user: "Putu Agus", text: "Pohon endemik lebih tahan hama, cocok buat jangka panjang.", time: "1 minggu lalu" },
    { user: "Gede Wiratha", text: "Desa kami sudah buat perarem (perdes) tentang perlindungan mata air.", time: "1 minggu lalu" },
    { user: "Luh Sri", text: "Saya lihat mata air mulai muncul lagi di daerah yang ditanami bambu.", time: "2 minggu lalu" },
    { user: "Wayan Artana", text: "Target 5.000 bibit tercapai, mari kita kawal terus!", time: "2 minggu lalu" },
  ],
  2: [ // project index 2 = Senjoyo Trench Network — 23 comments
    { user: "Ahmad Fauzi", text: "Rorak di Senjoyo sangat efektif cegah banjir waktu hujan.", time: "1 hari lalu" },
    { user: "Sari Dewi", text: "Saya lihat langsung dampaknya, air tanah naik.", time: "3 hari lalu" },
    { user: "Hendra K.", text: "Desain roraknya sudah cocok dengan kontur tanah.", time: "5 hari lalu" },
    { user: "Tono P.", text: "Monggo didukung, ini proyek nyata untuk warga.", time: "1 minggu lalu" },
    { user: "Rina W.", text: "Semoga segera approved, sudah ditinjau tim teknis.", time: "1 minggu lalu" },
    { user: "Slamet Riyadi", text: "Saluran resapan di Senjoyo sudah mulai berfungsi, air tidak langsung terbuang.", time: "2 jam lalu" },
    { user: "Wahyu Utomo", text: "Sebelum ada rorak, jalan desa sering banjir setinggi lutut. Sekarang aman.", time: "5 jam lalu" },
    { user: "Dwi Astuti", text: "Sumur warga mulai terisi lagi setelah musim kemarau panjang.", time: "9 jam lalu" },
    { user: "Supardi", text: "Teknik pengerjaannya sederhana tapi dampaknya luar biasa.", time: "12 jam lalu" },
    { user: "Endang S.", text: "Perlu perawatan rutin supaya rorak tidak tersumbat sampah.", time: "16 jam lalu" },
    { user: "Sugeng Hartono", text: "Saya siap jadi koordinator perawatan rorak di wilayah RW 3.", time: "20 jam lalu" },
    { user: "Tri Wahyuni", text: "Pemerintah desa sudah alokasikan dana untuk pemeliharaan.", time: "1 hari lalu" },
    { user: "Heru Santoso", text: "Dulu setiap hujan kebun saya kebanjiran, sekarang air meresap semua.", time: "1 hari lalu" },
    { user: "Ika Yunita", text: "Ayo tingkatkan jumlah rorak, target kita 500 unit tahun ini!", time: "2 hari lalu" },
    { user: "Agung Setiawan", text: "Pemasangan rorak di lahan miring juga mengurangi erosi tanah.", time: "2 hari lalu" },
    { user: "Rini Sulistyo", text: "Air tanah naik 3 meter setelah musim hujan pertama.", time: "3 hari lalu" },
    { user: "Prasetyo", text: "Metode ini cocok diterapkan di daerah lain yang rawan banjir.", time: "4 hari lalu" },
    { user: "Yuli Handayani", text: "Saya buat konten edukasi tentang rorak biar banyak yang tahu manfaatnya.", time: "5 hari lalu" },
    { user: "Joko Susanto", text: "Hari Sabtu gotong royong gali rorak baru, siapa siap ikut?", time: "6 hari lalu" },
    { user: "Nina Kurnia", text: "Tanaman di sekitar rorak tumbuh subur, ada air terus.", time: "1 minggu lalu" },
    { user: "Bambang W.", text: "Kerja sama tim antara masyarakat dan kontraktor berjalan baik.", time: "1 minggu lalu" },
    { user: "Desi Ratnasari", text: "Senjoyo jadi percontohan desa konservasi air se-Kabupaten.", time: "1 minggu lalu" },
    { user: "Hariyanto", text: "Jangan lupa juga buat sumur pantau untuk ukur dampak jangka panjang.", time: "2 minggu lalu" },
  ],
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

const STORAGE_KEY = "springhub-comments";

function loadPersistedComments(): Record<number, Array<{user: string; text: string; time: string}>> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function savePersistedComments(comments: Record<number, Array<{user: string; text: string; time: string}>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch {}
}

export function FeaturedProjects() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [likedProjects, setLikedProjects] = useState<Record<number, boolean>>({});
  const [commentText, setCommentText] = useState("");
  const [currentComments, setCurrentComments] = useState(featuredProjects.map(p => p.comments));
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState<Record<number, Array<{ user: string; text: string; time: string }>>>(loadPersistedComments);
  const [realComments, setRealComments] = useState<Record<number, Array<{user: string; text: string; time: string}>>>({});
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    savePersistedComments(localComments);
  }, [localComments]);

  useEffect(() => {
    if (!showComments) return;
    setCommentsLoading(true);
    fetch(`/api/projects/${page}/comments`)
      .then(r => r.json())
      .then(data => {
        if (data.comments) {
          setRealComments(prev => ({
            ...prev,
            [page - 1]: data.comments.map((c: any) => ({
              user: c.user?.username || "Anonim",
              text: c.text,
              time: formatTimeAgo(c.createdAt),
            })),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [showComments, page]);

  if (!featuredProjects.length) return null;

  const project = featuredProjects[page - 1] ?? featuredProjects[0];
  const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));

  return (
    <div>
      <div className="mx-auto max-w-lg">
        <h2 className="text-center text-2xl font-extrabold md:text-3xl">
          {t("donate.featuredProjects")}
        </h2>
        <p className="mt-2 text-center text-sm text-ink-muted">
          {t("donate.everyDonation")}
        </p>

        <div className="card mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {PROJECT_ICONS[project.typeId] || "\uD83D\uDCCB"} {t("projects.type." + project.typeId)}
            </span>
            <span className={`ml-auto text-xs font-medium ${
              project.status === "approved" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {project.status === "approved" ? `\u2705 ${t("projects.verified")}` : `\u23F3 ${t("projects.underReview")}`}
            </span>
          </div>

          <h3 className="text-lg font-bold text-ink">{project.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{project.summary}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Rp {formatNumber(project.raised)}</span>
              <span className="text-ink-muted">/ Rp {formatNumber(project.goal)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
              <span>{pct}% {t("projects.collected")}</span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> {project.backers} {t("projects.supporters")}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
            <HardHat className="h-3 w-3" /> {project.region}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {featuredProjects.length > 1 && (
              <>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-30">
                  ←
                </button>
                <span className="text-xs text-ink-muted">{page}/{featuredProjects.length}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= featuredProjects.length}
                  className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-30">
                  →
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink-line pt-3 dark:border-slate-700">
            <button
              onClick={async () => {
                // Optimistic toggle
                setLikedProjects(prev => ({ ...prev, [page]: !prev[page] }));
                // Try to sync with API
                try {
                  await fetch(`/api/projects/${page}/like`, { method: "POST" });
                } catch {
                  // Revert on failure
                  setLikedProjects(prev => ({ ...prev, [page]: !prev[page] }));
                }
              }}
              className={`inline-flex items-center gap-1.5 text-xs transition ${
                likedProjects[page]
                  ? "text-brand-600"
                  : "text-ink-muted hover:text-ink dark:hover:text-white"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${likedProjects[page] ? "fill-current" : ""}`} />
              {likedProjects[page] ? project.likes + 1 : project.likes}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink dark:hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              {currentComments[page - 1]}
            </button>
          </div>

          {showComments && (
            <div className="mt-3 border-t border-ink-line pt-3 space-y-3 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-ink">Komentar ({currentComments[page - 1]})</h4>
              
              {/* Comments list — newest first, scrollable */}
              <div className="space-y-2 overflow-y-auto touch-pan-y overscroll-contain" style={{ maxHeight: "60vh" }}>
                {commentsLoading ? (
                  <p className="text-xs text-ink-muted text-center py-4">Memuat komentar...</p>
                ) : (
                  [...(localComments[page - 1] || []), ...(realComments[page - 1] || []), ...(dummyComments[page - 1] || [])]
                    .reverse()
                    .map((c, i) => (
                      <div key={`${c.user}-${i}`} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{c.user}</span>
                          <span className="text-[10px] text-ink-subtle">{c.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted">{c.text}</p>
                      </div>
                    ))
                )}
                {(dummyComments[page - 1] || []).length === 0 && (localComments[page - 1] || []).length === 0 && (realComments[page - 1] || []).length === 0 && !commentsLoading && (
                  <p className="text-xs text-ink-muted text-center py-4">Belum ada komentar.</p>
                )}
              </div>

              {/* Comment input — only for logged in users */}
              {user ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commentText.trim() || !user) return;
                    const newComment = {
                      user: user.username,
                      text: commentText.trim(),
                      time: "Baru saja",
                    };
                    // Optimistic: show immediately
                    setLocalComments(prev => ({
                      ...prev,
                      [page - 1]: [newComment, ...(prev[page - 1] || [])],
                    }));
                    setCurrentComments(prev => {
                      const next = [...prev];
                      next[page - 1] = (next[page - 1] || 0) + 1;
                      return next;
                    });
                    setCommentText("");
                    // Save to API
                    try {
                      await fetch(`/api/projects/${page}/comments`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: newComment.text }),
                      });
                    } catch {
                      // Revert on failure
                      setLocalComments(prev => ({
                        ...prev,
                        [page - 1]: (prev[page - 1] || []).filter((_, i) => i !== 0),
                      }));
                    }
                  }}
                  className="flex gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-1 rounded-lg border border-ink-line px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 dark:bg-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    Kirim
                  </button>
                </form>
              ) : (
                <div className="rounded-lg bg-amber-50 p-2.5 text-center dark:bg-amber-900/20">
                  <Link href="/sign-in?redirect=/" className="text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-amber-300">
                    Login untuk berkomentar
                  </Link>
                </div>
              )}
            </div>
          )}

          <Link href={`mailto:info@jagasemesta.id?subject=Dukung ${encodeURIComponent(project.title)}`}
            className="btn-primary mt-4 w-full justify-center gap-2">
            <Heart className="h-4 w-4" /> {t("donate.supportProject")}
          </Link>

          {project.status !== "approved" && (
            <p className="mt-2 text-center text-xs text-ink-muted">
              ⏳ {t("donate.awaitingVerification")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
