import { Logo } from "@/components/Logo";

export const metadata = { title: "Informativa privacy — EcuLion" };

export default function Privacy() {
  return (
    <main className="auth">
      <Logo href="/accedi" />
      <h1>Informativa privacy</h1>
      <p className="err">Testo da inserire: l&apos;informativa va scritta dal vostro consulente privacy prima di aprire l&apos;app ai clienti.</p>
      <p className="muted">Deve indicare almeno: titolare del trattamento, dati raccolti (dati dell&apos;officina, pratiche, foto delle centraline, ricerche), finalità (ritiro, riparazione, garanzia, fatturazione, aggiornamenti WhatsApp con consenso), fornitori usati (hosting, database, servizi di AI e pagamento), tempi di conservazione e diritti dell&apos;interessato.</p>
    </main>
  );
}
