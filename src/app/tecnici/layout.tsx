export const metadata = {
  title: "Laboratorio — EcuLion",
  manifest: "/manifest-lab.webmanifest",
  appleWebApp: { capable: true, title: "EcuLion Lab", statusBarStyle: "default" as const },
};

export default function LayoutTecnici({ children }: { children: React.ReactNode }) {
  return children;
}
