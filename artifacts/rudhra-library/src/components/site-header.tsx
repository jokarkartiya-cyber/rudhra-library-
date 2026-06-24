import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import logoImg from "@/assets/rudhra-logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto px-4 md:px-6">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <img src={logoImg} alt="Rudhra Library logo" className="h-6 w-6 rounded-full object-cover" />
            <span className="hidden font-serif font-bold sm:inline-block">
              Rudhra Library
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/admin"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Admin
            </Link>
            <Link
              href="/admin/files"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Files
            </Link>
            <Link
              href="/verify"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Verify Card
            </Link>
          </nav>
        </div>
        
        {/* Mobile Nav */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none md:hidden">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <img src={logoImg} alt="Rudhra Library logo" className="h-5 w-5 rounded-full object-cover" />
              <span className="font-serif font-bold inline-block">
                Rudhra Library
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-2">
            <div className="md:hidden flex space-x-2 mr-2">
              <Link
                href="/admin"
                className="text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Admin
              </Link>
              <Link
                href="/admin/files"
                className="text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Files
              </Link>
              <Link
                href="/verify"
                className="text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Verify
              </Link>
            </div>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
