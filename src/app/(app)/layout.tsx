import AppNavbar from "@/components/app-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background">
      <AppNavbar />
      {children}
    </div>
  );
}
