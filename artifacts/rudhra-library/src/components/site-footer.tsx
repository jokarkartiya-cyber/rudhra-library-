import { MapPin, Phone, Clock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t bg-background py-8 md:py-12">
      <div className="container px-4 md:px-6 mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold">Rudhra Library</h3>
          <p className="text-sm text-muted-foreground">
            A premium reading and studying environment designed for deep focus and academic excellence.
          </p>
          <div className="text-sm font-medium">
            Owner: <span className="text-primary">Ankit Kumar</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+919528335124" className="hover:text-primary transition-colors">+91 9528335124</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+917900799154" className="hover:text-primary transition-colors">+91 7900799154</a>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Location</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Agra, Uttar Pradesh<br/>India</span>
            </li>
            <li>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=27.0032965,78.5823932"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1 mt-2"
              >
                Visit on Google Maps
              </a>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Hours</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Open Daily: 6 AM - 11 PM</span>
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
