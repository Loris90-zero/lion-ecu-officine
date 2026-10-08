import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fatturazioneCompleta } from "@/lib/fatturazione";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ errore: "Accedi." }, { status: 401 });
  const { praticaId } = await request.json().catch(() => ({}));
  // Lettura con i permessi dell'utente: se la pratica non è sua, non la vede
  const { data: p } = await sb.from("pratiche").select("id, numero, mezzo, centralina, esito, prezzo_confermato_eur, pagato").eq("id", String(praticaId)).maybeSingle();
  if (!p) return NextResponse.json({ errore: "Pratica non trovata." }, { status: 404 });
  if (p.pagato) return NextResponse.json({ errore: "Già pagata." }, { status: 400 });
  if (p.esito !== "riparabile" || !p.prezzo_confermato_eur) return NextResponse.json({ errore: "Non ancora da pagare." }, { status: 400 });

  const { data: o } = await sb.from("officine").select("partita_iva, sede_legale, codice_sdi, pec").eq("owner_id", user.id).maybeSingle();
  if (!o || !fatturazioneCompleta(o)) return NextResponse.json({ errore: "Mancano i dati per la fattura." }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "it",
    customer_email: user.email ?? undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(Number(p.prezzo_confermato_eur) * 100),
        product_data: { name: `Riparazione centralina · pratica ${p.numero}`, description: [p.mezzo, p.centralina].filter(Boolean).join(" · ") },
      },
    }],
    metadata: { pratica_id: p.id },
    success_url: `${base}/pratica/${p.id}?pagato=1`,
    cancel_url: `${base}/pratica/${p.id}`,
  });
  await supabaseAdmin().from("pratiche").update({ stripe_session_id: session.id }).eq("id", p.id);
  return NextResponse.json({ url: session.url });
}
