import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
        <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
      </div>
      <h1 className="mt-6 text-display-lg text-text-primary">404</h1>
      <p className="mt-2 text-body-lg text-text-secondary">This page doesn't exist.</p>
      <Link href="/" className="mt-6 text-body-md font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
