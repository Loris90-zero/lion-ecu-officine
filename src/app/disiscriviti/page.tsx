import { supabaseAdmin } from "@/lib/supabase/admin";
import { Logo } from "@/components/Logo";
import { disiscrivi } from "./azione";

export const metadata = { title: "Disiscrizione — EcuLion", robots: { index: false } };

export default async function Disiscriviti({ searchParams }: { searchParams: Promise<{ t?: string; ok?: string }> }) {
  const { t = "", ok } = await searchParams;
  const valido = /^[0-9a-f-]{36}$/i.test(t);
  const p = valido ? (await supabaseAdmin().from("prospect").select("nome, stato").eq("token", t).maybeSingle()).data : null;
  return (
    <div className="app" style={{ paddingTop: 32 }}>
      <Logo />
      <section className="box" style={{ marginTop: 24, display: "grid", gap: 14 }}>
        {!p ? <p>Il link non è valido o è scaduto. Se vuoi essere tolto dai nostri contatti scrivi a info@eculion.it.</p>
          : ok || p.stato === "disiscritto" ? <><h1>Fatto</h1><p>{p.nome} non riceverà più nostre email commerciali.</p></>
          : (
            <form action={disiscrivi} style={{ display: "grid", gap: 14 }}>
              <h1>Non vuoi più ricevere le nostre email?</h1>
              <p className="muted">Togliamo {p.nome} dai contatti commerciali di EcuLion.</p>
              <input type="hidden" name="t" value={t} />
              <button className="btn btn-primary" type="submit">Sì, toglimi dai contatti</button>
            </form>
          )}
      </section>
    </div>
  );
}
