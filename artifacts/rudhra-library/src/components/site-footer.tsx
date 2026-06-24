import { MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t bg-background py-8 md:py-12">
      <div className="container px-4 md:px-6 mx-auto grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold">Rudhra Library</h3>
          <p className="text-sm text-muted-foreground">A reading and studying environment designed for focus.</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+917088830367" className="hover:text-primary transition-colors">+91 7088830367</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+917900799154" className="hover:text-primary transition-colors">+91 7900799154</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+919528335124" className="hover:text-primary transition-colors">+91 9528335124</a>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Location</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Ground Floor, Shikohabad,<br/>Bateshwar Rd, Nasirpur,<br/>Nagla Rama, Uttar Pradesh 283141<br/>India</span>
            </li>
            <li>
              <a href="https://wa.me/917088830367" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-semibold text-white mt-2 transition-all hover:bg-[#1ebe5a]">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 border-t pt-8 px-4 md:px-6 mx-auto text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Rudhra Library. All rights reserved.
      </div>
    </footer>
  );
}
