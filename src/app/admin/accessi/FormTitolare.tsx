"use client";
import { useActionState } from "react";
import { aggiungiTitolare, type StatoF } from "../azioni";

export function FormTitolare() {
  const [s, a, c] = useActionState<StatoF, FormData>(aggiungiTitolare, {});
  return (
    <form action={a}>
      <div className="grid2">
        <div className="field"><label htmlFor="t-email">Email</label><input id="t-email" name="email" type="email" required /></div>
        <div className="field"><label htmlFor="t-nome">Nome</label><input id="t-nome" name="nome" /></div>
      </div>
      {s.errore ? <p className="err">{s.errore}</p> : null}{s.ok ? <p className="okmsg">{s.ok}</p> : null}
      <button className="btn btn-primary" disabled={c}>Aggiungi super admin</button>
    </form>
  );
}
