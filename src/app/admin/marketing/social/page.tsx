import Link from "next/link";
import { richiediTitolare } from "@/lib/sessione";
import { Modulo } from "../Modulo";
import { salvaPost, eliminaPost } from "../azioni";

export const dynamic = "force-dynamic";

const CANALI = [["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["linkedin", "LinkedIn"], ["youtube", "YouTube Shorts"]] as const;
type Post = { id: number; testo: string; canali: string[]; media_url: string | null; programmato_il: string | null; stato: string; risultati: { like?: number; commenti?: number; visualizzazioni?: number; condivisioni?: number } };
const giorno = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(d);
const ora = (iso: string) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default async function Social({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { sb } = await richiediTitolare();
  const sett = Math.max(-8, Math.min(8, Number((await searchParams).s) || 0));
  const lun = new Date(); lun.setHours(12, 0, 0, 0);
  lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7) + sett * 7);
  const giorni = Array.from({ length: 7 }, (_, i) => { const d = new Date(lun); d.setDate(d.getDate() + i); return d; });
  const da = new Date(giorni[0]); da.setDate(da.getDate() - 1);
  const a = new Date(giorni[6]); a.setDate(a.getDate() + 1);
  const [{ data: sett_ }, { data: bozze }, { data: pubbl }] = await Promise.all([
    sb.from("social_post").select("*").gte("programmato_il", da.toISOString()).lte("programmato_il", a.toISOString()).order("programmato_il"),
    sb.from("social_post").select("*").eq("stato", "bozza").order("creato_il", { ascending: false }).limit(20),
    sb.from("social_post").select("*").eq("stato", "pubblicato").order("programmato_il", { ascending: false }).limit(30),
  ]);
  const posts = (sett_ ?? []) as Post[];
  const pub = (pubbl ?? []) as Post[];
  const somma = (k: keyof Post["risultati"]) => pub.reduce((s, p) => s + (Number(p.risultati?.[k]) || 0), 0);
  const oggi = giorno(new Date());
  const fmt = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Social</p>
          <h1 className="mk-h1">Calendario dei contenuti</h1>
          <p className="mk-sotto">Scrivi o fai preparare i post, mettili in calendario: quando colleghiamo Metricool partono da soli all&apos;ora giusta e qui tornano like, commenti e visualizzazioni.</p>
        </div>
        <nav className="mk-periodi" aria-label="Settimana">
          <Link href={`/admin/marketing/social?s=${sett - 1}`}>← Prima</Link>
          <Link href="/admin/marketing/social" aria-current={sett === 0 ? "true" : undefined}>Questa settimana</Link>
          <Link href={`/admin/marketing/social?s=${sett + 1}`}>Dopo →</Link>
        </nav>
      </header>

      <div className="mk-stats">
        <div><b>{pub.length}</b><small>post pubblicati</small></div>
        <div><b>{somma("visualizzazioni").toLocaleString("it-IT")}</b><small>visualizzazioni</small></div>
        <div><b>{somma("like").toLocaleString("it-IT")}</b><small>like</small></div>
        <div><b>{somma("commenti").toLocaleString("it-IT")}</b><small>commenti</small></div>
      </div>

      <article className="mk-box">
        <div className="mk-cal">
          {giorni.map((d) => {
            const g = giorno(d);
            const del = posts.filter((p) => p.programmato_il && giorno(new Date(p.programmato_il)) === g);
            return (
              <div key={g} className={g === oggi ? "mk-oggi" : ""}>
                <span className="mk-cal-g">{fmt.format(d)}</span>
                {del.map((p) => <span key={p.id} className={`mk-cal-p${p.stato === "pubblicato" ? " mk-pub" : ""}`} title={p.testo}>{ora(p.programmato_il!)} · {p.testo}</span>)}
              </div>
            );
          })}
        </div>
      </article>

      <div className="mk-griglia2">
        <article className="mk-box">
          <div className="mk-box-testa"><h2>Nuovo post</h2></div>
          <Modulo azione={salvaPost} pulsante="Salva" svuota>
            <label>Testo<textarea name="testo" maxLength={2200} placeholder="Centralina EBS di un Actros: preventivo in un minuto, riparata in 3 giorni…" /></label>
            <div className="mk-canali">{CANALI.map(([k, n]) => <label key={k}><input type="checkbox" name="canali" value={k} defaultChecked={k === "instagram" || k === "facebook"} />{n}</label>)}</div>
            <div className="mk-righe">
              <label>Quando (vuoto = bozza)<input type="datetime-local" name="quando" /></label>
              <label>Foto o video (link)<input name="media" placeholder="https://…" /></label>
            </div>
          </Modulo>
        </article>
        <article className="mk-box">
          <div className="mk-box-testa"><h2>Bozze</h2></div>
          {(bozze ?? []).length === 0 ? <p className="mk-vuoto">Nessuna bozza. Quando colleghiamo Canva e Descript, Claude prepara qui grafiche e video da approvare.</p> : (
            <ul className="mk-lista">
              {((bozze ?? []) as Post[]).map((p) => (
                <li key={p.id}>
                  <span style={{ fontSize: 14 }}>{p.testo.slice(0, 180)}{p.testo.length > 180 ? "…" : ""}</span>
                  <div className="mk-riga"><span className="mk-piccolo">{p.canali.join(" · ")}</span><form action={eliminaPost}><input type="hidden" name="id" value={p.id} /><button className="mk-btn mk-btn-2 mk-btn-pic">Elimina</button></form></div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
