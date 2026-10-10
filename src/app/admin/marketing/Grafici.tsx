/** Grafici in SVG puro, animati con il CSS: niente librerie. */

type Punto = { g: string; [k: string]: number | string };

export function Sparkline({ valori, colore = "var(--mk-acc)" }: { valori: number[]; colore?: string }) {
  if (valori.length < 2) return null;
  const max = Math.max(1, ...valori), w = 100, h = 28;
  const pts = valori.map((v, i) => [(i / (valori.length - 1)) * w, h - 2 - (v / max) * (h - 4)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg className="mk-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={colore} opacity=".12" />
      <path d={d} fill="none" stroke={colore} strokeWidth="1.6" vectorEffect="non-scaling-stroke" className="mk-traccia" pathLength={1} />
    </svg>
  );
}

const breve = (g: string) => { const [, m, d] = g.split("-"); return `${Number(d)}/${Number(m)}`; };

/** Contatti al giorno (area gialla) e spesa ads (linea), ognuno sulla sua scala. */
export function Andamento({ serie }: { serie: Punto[] }) {
  const W = 760, H = 240, P = { l: 8, r: 8, t: 16, b: 28 };
  const n = serie.length;
  const lead = serie.map((s) => Number(s.lead)), spesa = serie.map((s) => Number(s.spesa)), wa = serie.map((s) => Number(s.whatsapp));
  const maxL = Math.max(1, ...lead, ...wa), maxS = Math.max(1, ...spesa);
  const x = (i: number) => P.l + (n === 1 ? (W - P.l - P.r) / 2 : (i / (n - 1)) * (W - P.l - P.r));
  const yL = (v: number) => H - P.b - (v / maxL) * (H - P.t - P.b);
  const yS = (v: number) => H - P.b - (v / maxS) * (H - P.t - P.b);
  const linea = (vals: number[], y: (v: number) => number) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const ogni = Math.max(1, Math.ceil(n / 8));
  if (n === 1) {
    return <div className="mk-vuoto-graf">Un giorno solo: scegli 7, 30 o 90 giorni per vedere l&apos;andamento.</div>;
  }
  return (
    <svg className="mk-andamento" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Andamento giornaliero di contatti, WhatsApp e spesa">
      <defs>
        <linearGradient id="mkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ebb513" stopOpacity=".45" />
          <stop offset="1" stopColor="#ebb513" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => <line key={k} x1={P.l} x2={W - P.r} y1={yL(maxL * k)} y2={yL(maxL * k)} className="mk-griglia" />)}
      <path d={`${linea(lead, yL)} L${x(n - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`} fill="url(#mkArea)" className="mk-sale" />
      <path d={linea(lead, yL)} className="mk-l-lead mk-traccia" pathLength={1} />
      <path d={linea(wa, yL)} className="mk-l-wa mk-traccia" pathLength={1} />
      <path d={linea(spesa, yS)} className="mk-l-spesa mk-traccia" pathLength={1} />
      {serie.map((s, i) => (
        <g key={s.g} className="mk-punto">
          <rect x={x(i) - (W / n) / 2} y={P.t} width={W / n} height={H - P.t - P.b} fill="transparent" />
          <circle cx={x(i)} cy={yL(lead[i])} r="3.5" />
          <title>{`${breve(s.g)}: ${lead[i]} contatti, ${wa[i]} WhatsApp, ${Math.round(spesa[i])} € spesa`}</title>
          {i === n - 1 || (i % ogni === 0 && n - 1 - i >= ogni * 0.7) ? <text x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{breve(s.g)}</text> : null}
        </g>
      ))}
    </svg>
  );
}

/** Ciambella: come ci contattano. */
export function Ciambella({ parti }: { parti: { nome: string; v: number; colore: string }[] }) {
  const tot = parti.reduce((a, p) => a + p.v, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="mk-ciambella">
      <svg viewBox="0 0 140 140" role="img" aria-label="Da dove ci scrivono">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--mk-linea)" strokeWidth="16" />
        {tot > 0 && parti.map((p, i) => {
          const l = (p.v / tot) * C;
          const el = <circle key={p.nome} cx="70" cy="70" r={R} fill="none" stroke={p.colore} strokeWidth="16" strokeDasharray={`${l} ${C - l}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" className="mk-fetta" style={{ animationDelay: `${i * 120}ms` }} />;
          acc += l;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="mk-c-num">{tot}</text>
        <text x="70" y="86" textAnchor="middle" className="mk-c-lab">contatti</text>
      </svg>
      <ul>
        {parti.map((p) => (
          <li key={p.nome}><i style={{ background: p.colore }} /><span>{p.nome}</span><b>{p.v}</b><small>{tot ? Math.round((p.v / tot) * 100) : 0}%</small></li>
        ))}
      </ul>
    </div>
  );
}

/** Imbuto: dalla visita al ritiro, con la conversione tra un passo e l'altro. */
export function Imbuto({ passi }: { passi: { nome: string; v: number }[] }) {
  const max = Math.max(1, ...passi.map((p) => p.v));
  return (
    <ol className="mk-imbuto">
      {passi.map((p, i) => {
        const prima = i ? passi[i - 1].v : null;
        return (
          <li key={p.nome}>
            <div className="mk-i-testa"><span>{p.nome}</span><b>{p.v.toLocaleString("it-IT")}</b></div>
            <div className="mk-i-barra"><i style={{ width: `${Math.max(2, (p.v / max) * 100)}%`, animationDelay: `${i * 90}ms` }} /></div>
            {prima !== null ? <small>{prima > 0 ? `${Math.round((p.v / prima) * 100)}% dal passo prima` : "—"}</small> : <small>&nbsp;</small>}
          </li>
        );
      })}
    </ol>
  );
}
