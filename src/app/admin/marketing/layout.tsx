import "./marketing.css";
import { Schede } from "./Schede";

export const metadata = { title: "Marketing — EcuLion" };

export default function LayoutMarketing({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk">
      <Schede />
      {children}
    </div>
  );
}
