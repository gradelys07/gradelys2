import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistant rapide — Gradelys",
  description: "Assistant rapide Gradelys pour t'expliquer étape par étape.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuickLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="quick-root-shell min-h-dvh w-full">{children}</div>;
}
