import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificaStaff } from "@/lib/notifiche";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const firma = request.headers.get("stripe-signature");
  const corpo = await request.text();
  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(corpo, firma ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ errore: "Firma non valida" }, { status: 400 });
  }
  if (evento.type === "checkout.session.completed") {
    const s = evento.data.object as Stripe.Checkout.Session;
    const id = s.metadata?.pratica_id;
    if (id && s.payment_status === "paid") {
      const admin = supabaseAdmin();
      const { data: p } = await admin.from("pratiche").update({ pagato: true, pagato_il: new Date().toISOString(), prezzo_pagato_eur: (s.amount_total ?? 0) / 100, sconto_pct: Number(s.metadata?.sconto_pct ?? 0) || 0 }).eq("id", id).eq("pagato", false).select("id, numero, centralina, mezzo").maybeSingle();
      if (p) await notificaStaff(admin, { tipo: "pagamento", titolo: `Pagamento ricevuto · ${p.numero}`, testo: `${p.centralina || p.mezzo}: si può procedere con la riparazione.`, link: `/lab/pratica/${p.id}`, pratica_id: p.id });
    }
  }
  return NextResponse.json({ ricevuto: true });
}
