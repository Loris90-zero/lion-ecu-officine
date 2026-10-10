"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
type Sistema = "android" | "iphone" | "computer";

const Puntini = () => <svg viewBox="0 0 24 24" className="ins-ico" aria-hidden="true"><circle cx="12" cy="5" r="2.2" fill="currentColor" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><circle cx="12" cy="19" r="2.2" fill="currentColor" /></svg>;
const Condividi = () => <svg viewBox="0 0 24 24" className="ins-ico" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>;
const Piu = () => <svg viewBox="0 0 24 24" className="ins-ico" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>;

/** Come appare l'app sulla schermata Home: l'icona gialla con la L e il leone, con scritto EcuLion. */
export function SchermataHome() {
  return (
    <div className="ins-telefono" role="img" aria-label="Schermata Home del telefono con l'icona EcuLion">
      <div className="ins-griglia">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="ins-app"><i /><span /></div>)}
        <div className="ins-app ins-nostra">
          <img src="/icone/icona-192.png" alt="" width={192} height={192} />
          <b>EcuLion</b>
        </div>
      </div>
      <div className="ins-freccia">È questa</div>
    </div>
  );
}

export function GuidaInstallazione({ dopo }: { dopo: string }) {
  const [sistema, setSistema] = useState<Sistema>("android");
  const [installata, setInstallata] = useState(false);
  const [evento, setEvento] = useState<BIP | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setSistema(/iphone|ipad|ipod/i.test(ua) ? "iphone" : /android/i.test(ua) ? "android" : "computer");
    setInstallata(window.matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as { standalone?: boolean }).standalone);
    const h = (e: Event) => { e.preventDefault(); setEvento(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    const fatto = () => setInstallata(true);
    window.addEventListener("appinstalled", fatto);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", fatto); };
  }, []);

  if (installata)
    return (
      <div className="section" style={{ gap: 16 }}>
        <h2 style={{ margin: 0 }}>L&apos;app è installata</h2>
        <p>Da ora la trovi sulla schermata Home del telefono, con questa icona:</p>
        <SchermataHome />
        <a className="btn btn-primary btn-block btn-xl" href={dopo}>Vai all&apos;app</a>
      </div>
    );

  return (
    <div className="section" style={{ gap: 18 }}>
      <div className="ins-scelta" role="tablist" aria-label="Il tuo telefono">
        {(["android", "iphone"] as Sistema[]).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={sistema === s} className={sistema === s ? "attivo" : ""} onClick={() => setSistema(s)}>{s === "android" ? "Android (Samsung, Xiaomi…)" : "iPhone"}</button>
        ))}
      </div>

      {sistema === "iphone" ? (
        <>
          <p style={{ margin: 0 }}>Devi aprire questa pagina con <b>Safari</b>, il browser con la bussola blu.</p>
          <ol className="ins-passi">
            <li><span className="ins-n">1</span><div>Tocca il pulsante <b>Condividi</b> <Condividi />, in basso al centro dello schermo.</div></li>
            <li><span className="ins-n">2</span><div>Scorri l&apos;elenco verso il basso e tocca <b>Aggiungi alla schermata Home</b> <Piu />.</div></li>
            <li><span className="ins-n">3</span><div>Tocca <b>Aggiungi</b>, in alto a destra.</div></li>
          </ol>
        </>
      ) : (
        <>
          {evento ? (
            <button type="button" className="btn btn-primary btn-block btn-xl" onClick={async () => { await evento.prompt(); setEvento(null); }}>Installa EcuLion con un tocco</button>
          ) : null}
          <p style={{ margin: 0 }}>{evento ? "Se il pulsante non funziona, fai così:" : "Apri questa pagina con Chrome e fai così:"}</p>
          <ol className="ins-passi">
            <li><span className="ins-n">1</span><div>Tocca i <b>tre puntini</b> <Puntini />, in alto a destra.</div></li>
            <li><span className="ins-n">2</span><div>Tocca <b>Installa app</b> (su alcuni telefoni si chiama <b>Aggiungi a schermata Home</b>).</div></li>
            <li><span className="ins-n">3</span><div>Conferma con <b>Installa</b>.</div></li>
          </ol>
        </>
      )}

      <div className="box">
        <b>Dopo la troverai qui</b>
        <p style={{ margin: 0 }}>Sulla schermata Home del telefono, insieme alle altre app: l&apos;<b>icona gialla con la L e il leone</b>, con scritto <b>EcuLion</b>. Toccala e sei dentro, senza scaricare niente dallo store.</p>
        <SchermataHome />
      </div>
      <a className="btn btn-ghost btn-block" href={dopo}>Lo faccio dopo, vai all&apos;app</a>
    </div>
  );
}
