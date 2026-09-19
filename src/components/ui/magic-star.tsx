import { cn } from "@/lib/utils";
import Image from "next/image";

export const MagicStar = ({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => {
  return (
    <img 
      src="/visualize-icon.ico" 
      alt="Visualize Icon" 
      className={cn("lucide lucide-magic-star object-contain transform scale-150", className)}
      {...(props as any)}
    />
  );
};
