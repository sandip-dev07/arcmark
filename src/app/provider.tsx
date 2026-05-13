import { Toaster } from "@/components/ui/sonner";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
