import AppLogo from "./app-logo";

export default function AppNavbar() {
  return (
    <nav className="w-full border-b border-border/70 h-14 sm:h-16 flex items-center">
      <div className="max-w-container">
        <AppLogo href="/" />
      </div>
    </nav>
  );
}
