import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChevronRight, Clock, ShieldCheck, BookOpen, Users, Coffee, MapPin, Phone, Info, AlertTriangle, Megaphone, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero.png";
import booksImg from "@/assets/books.png";
import cubicleImg from "@/assets/cubicle.png";
import logoImg from "@/assets/rudhra-logo.png";

const shifts = [
  { name: "Morning", time: "6 AM - 10 AM", desc: "Start your day with deep, uninterrupted focus." },
  { name: "Afternoon", time: "10 AM - 2 PM", desc: "Perfect for a midday study session." },
  { name: "Evening", time: "2 PM - 6 PM", desc: "Wind down your day with productive reading." },
  { name: "Night", time: "6 PM - 11 PM", desc: "For the night owls who prefer absolute silence." },
  { name: "Full Day", time: "6 AM - 11 PM", desc: "Ultimate flexibility for serious scholars." },
];

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const TYPE_STYLES: Record<string, string> = {
  info: "border-blue-400 bg-blue-50/80 text-blue-800",
  warning: "border-amber-400 bg-amber-50/80 text-amber-800",
  urgent: "border-red-400 bg-red-50/80 text-red-800",
  event: "border-green-400 bg-green-50/80 text-green-800",
};

const TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertTriangle,
  event: Megaphone,
};

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<Array<{id: number; title: string; message: string; type: string; expiresAt: string | null; createdAt: string}>>([]);

  useEffect(() => {
    fetch(`${BASE}/api/announcements/active`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setAnnouncements(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (logoClicks === 0) return;
    if (logoClicks >= 5) {
      setShowAdmin(true);
      setLogoClicks(0);
      return;
    }
    const timer = setTimeout(() => setLogoClicks(0), 2000);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Immersive Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md border-b shadow-sm py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setLogoClicks(c => c + 1)}
          >
            <img src={logoImg} alt="Rudhra Library logo" className="h-9 w-9 rounded-full object-cover" />
            <span className={`font-serif font-bold text-xl tracking-tight ${scrolled ? "text-foreground" : "text-white"}`}>
              Rudhra Library
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/verify">
              <Button variant={scrolled ? "outline" : "secondary"} className={!scrolled ? "bg-white/20 text-white hover:bg-white/30 border-none" : ""}>
                Verify Card
              </Button>
            </Link>
            {showAdmin && (
              <Link href="/admin">
                <Button className={scrolled ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white text-primary hover:bg-white/90"}>
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-20" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            src={heroImg} 
            alt="Rudhra Library Interior" 
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="container relative z-30 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
              A Sanctuary for <br />
              <span className="text-secondary">Deep Focus</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto">
              A quiet and focused environment for reading and studying.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 h-14 rounded-full">
                Reserve a Seat
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/verify" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20 text-lg px-8 h-14 rounded-full backdrop-blur-sm">
                  Verify Student Card
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Megaphone className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-2xl font-bold">Announcements</h2>
            </div>
            <div className="space-y-4">
              {announcements.map(a => {
                const TypeIcon = TYPE_ICONS[a.type] || Info;
                return (
                  <div key={a.id} className={`border-l-4 rounded-xl p-6 shadow-md bg-card hover:shadow-lg transition-shadow ${TYPE_STYLES[a.type] || TYPE_STYLES.info}`}>
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h3 className="font-bold text-lg">{a.title}</h3>
                          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(new Date(a.createdAt), "MMM d, yyyy")}
                            </div>
                            {a.expiresAt && (
                              <span className="bg-card px-2 py-0.5 rounded-full border text-[11px]">
                                Till {format(new Date(a.expiresAt), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-line mt-2 leading-relaxed">{a.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Shifts Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Flexible Timings</h2>
            <p className="text-muted-foreground text-lg">Choose a shift that perfectly aligns with your study schedule. We are open from 6 AM to 11 PM every day.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift, index) => (
              <motion.div
                key={shift.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-serif mb-2">{shift.name}</h3>
                <div className="text-secondary font-bold text-lg mb-4">{shift.time}</div>
                <p className="text-muted-foreground">{shift.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Split Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Premium Amenities for Serious Scholars</h2>
                <p className="text-lg text-muted-foreground">Every detail of Rudhra Library has been crafted to eliminate distractions and maximize your productivity.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Secure & Safe</h4>
                    <p className="text-muted-foreground">CCTV surveillance and secure access control ensuring a safe environment for everyone.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Dedicated Cubicles</h4>
                    <p className="text-muted-foreground">Ergonomic seating with individual lighting and power outlets for your devices.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Refreshment Area</h4>
                    <p className="text-muted-foreground">Take a break in our dedicated lounge area to recharge your mind.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 mt-8">
                <img src={cubicleImg} alt="Library Cubicles" className="w-full h-64 object-cover rounded-2xl shadow-lg" />
                <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg">
                  <div className="text-4xl font-serif font-bold mb-2">100+</div>
                  <div className="text-primary-foreground/80 font-medium">Dedicated Seats</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-secondary text-secondary-foreground p-6 rounded-2xl shadow-lg">
                  <div className="text-4xl font-serif font-bold mb-2">24/7</div>
                  <div className="text-secondary-foreground/80 font-medium">Power Backup & Wi-Fi</div>
                </div>
                <img src={booksImg} alt="Library Books" className="w-full h-64 object-cover rounded-2xl shadow-lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
              <MapPin className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Find Us</h2>
            <p className="text-muted-foreground text-lg">Visit us at our study center. We'd love to welcome you.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-5 bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="lg:col-span-2 p-10 xl:p-12 flex flex-col justify-center bg-gradient-to-br from-primary to-primary/90 text-primary-foreground relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px]" />
              <div className="relative">
                <h3 className="font-serif text-2xl font-bold mb-10 text-white flex items-center gap-3">
                  <span className="h-1 w-8 rounded-full bg-secondary" />
                  Contact & Location
                </h3>
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 ring-1 ring-white/10">
                      <Phone className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2 text-white/90 uppercase tracking-widest text-xs">Call Us</div>
                      <div className="flex flex-col space-y-1.5">
                        <a href="tel:+917088830367" className="text-primary-foreground/80 hover:text-white transition-colors text-base font-medium">+91 7088830367</a>
                        <a href="tel:+917900799154" className="text-primary-foreground/80 hover:text-white transition-colors text-base font-medium">+91 7900799154</a>
                        <a href="tel:+919528335124" className="text-primary-foreground/80 hover:text-white transition-colors text-base font-medium">+91 9528335124</a>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 ring-1 ring-white/10">
                      <MapPin className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2 text-white/90 uppercase tracking-widest text-xs">Address</div>
                      <p className="text-primary-foreground/80 leading-relaxed text-base">Ground Floor, Shikohabad,<br/>Bateshwar Rd, Nasirpur,<br/>Nagla Rama, Uttar Pradesh 283141<br/>India</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="pt-2 space-y-3"
                  >
                    <div className="font-semibold mb-2 text-white/90 uppercase tracking-widest text-xs">WhatsApp</div>
                    <div className="flex flex-wrap gap-2">
                      <a href="https://wa.me/917088830367" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/90 backdrop-blur px-3.5 py-2 font-semibold text-white shadow-lg transition-all hover:bg-[#25D366] hover:shadow-xl hover:-translate-y-0.5 text-sm">
                        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor"><path d="M19.11 17.5c-.27-.13-1.61-.79-1.86-.88-.25-.09-.43-.13-.62.13-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.13-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.06-.13-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.13 2.84.13.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.61-.66 1.84-1.29.23-.63.23-1.18.16-1.29-.07-.12-.25-.18-.52-.32zM16.02 5.34c-5.92 0-10.74 4.81-10.74 10.73 0 1.89.49 3.74 1.43 5.37L5.2 26.66l5.36-1.41c1.57.85 3.34 1.3 5.13 1.3h.01c5.92 0 10.74-4.81 10.74-10.73 0-2.87-1.12-5.56-3.14-7.59a10.66 10.66 0 0 0-7.6-3.14m0 19.55h-.01c-1.6 0-3.17-.43-4.55-1.25l-.33-.19-3.39.89.91-3.31-.21-.34a8.86 8.86 0 0 1-1.36-4.74c0-4.91 4-8.91 8.94-8.91 2.39 0 4.63.93 6.31 2.62 1.69 1.68 2.62 3.93 2.61 6.32 0 4.92-4 8.91-8.93 8.91"/></svg>
                        7088830367
                      </a>
                      <a href="https://wa.me/917900799154" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/90 backdrop-blur px-3.5 py-2 font-semibold text-white shadow-lg transition-all hover:bg-[#25D366] hover:shadow-xl hover:-translate-y-0.5 text-sm">
                        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor"><path d="M19.11 17.5c-.27-.13-1.61-.79-1.86-.88-.25-.09-.43-.13-.62.13-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.13-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.06-.13-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.13 2.84.13.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.61-.66 1.84-1.29.23-.63.23-1.18.16-1.29-.07-.12-.25-.18-.52-.32zM16.02 5.34c-5.92 0-10.74 4.81-10.74 10.73 0 1.89.49 3.74 1.43 5.37L5.2 26.66l5.36-1.41c1.57.85 3.34 1.3 5.13 1.3h.01c5.92 0 10.74-4.81 10.74-10.73 0-2.87-1.12-5.56-3.14-7.59a10.66 10.66 0 0 0-7.6-3.14m0 19.55h-.01c-1.6 0-3.17-.43-4.55-1.25l-.33-.19-3.39.89.91-3.31-.21-.34a8.86 8.86 0 0 1-1.36-4.74c0-4.91 4-8.91 8.94-8.91 2.39 0 4.63.93 6.31 2.62 1.69 1.68 2.62 3.93 2.61 6.32 0 4.92-4 8.91-8.93 8.91"/></svg>
                        7900799154
                      </a>
                      <a href="https://wa.me/919528335124" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/90 backdrop-blur px-3.5 py-2 font-semibold text-white shadow-lg transition-all hover:bg-[#25D366] hover:shadow-xl hover:-translate-y-0.5 text-sm">
                        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor"><path d="M19.11 17.5c-.27-.13-1.61-.79-1.86-.88-.25-.09-.43-.13-.62.13-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.13-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.06-.13-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.99 2.66 1.13 2.84.13.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.61-.66 1.84-1.29.23-.63.23-1.18.16-1.29-.07-.12-.25-.18-.52-.32zM16.02 5.34c-5.92 0-10.74 4.81-10.74 10.73 0 1.89.49 3.74 1.43 5.37L5.2 26.66l5.36-1.41c1.57.85 3.34 1.3 5.13 1.3h.01c5.92 0 10.74-4.81 10.74-10.73 0-2.87-1.12-5.56-3.14-7.59a10.66 10.66 0 0 0-7.6-3.14m0 19.55h-.01c-1.6 0-3.17-.43-4.55-1.25l-.33-.19-3.39.89.91-3.31-.21-.34a8.86 8.86 0 0 1-1.36-4.74c0-4.91 4-8.91 8.94-8.91 2.39 0 4.63.93 6.31 2.62 1.69 1.68 2.62 3.93 2.61 6.32 0 4.92-4 8.91-8.93 8.91"/></svg>
                        9528335124
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 min-h-[500px] relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-[1] pointer-events-none" />
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d700!2d78.5824442!3d27.002992!3m2!1i1024!2i768!4f13.1!5m2!1sen!2sin"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location"
              />
              <div className="absolute bottom-6 right-6 z-10">
                <a href="https://www.google.com/maps/place/Hindustan+Petroleum+Corporation+Limited/@27.0033346,78.5824243,3a,75y,86.68h,90t/data=!3m7!1e1!3m5!1s1hGwCHN1eKHEOM12f-xKMQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3D1hGwCHN1eKHEOM12f-xKMQ%26yaw%3D86.67740357157844!7i16384!8i8192!4m20!1m13!4m12!1m4!2m2!1d78.5873648!2d27.0880586!4e1!1m6!1m2!1s0x397434118d652d11:0x4a4b97db13817bd1!2sHindustan+Petroleum+Corporation+Limited,+Ground+Floor,+Shikohabad,+Bateshwar+Rd,+Nasirpur,+Nagla+Rama,+Uttar+Pradesh+283141!2m2!1d78.5824442!2d27.002992!3m5!1s0x397434118d652d11:0x4a4b97db13817bd1!8m2!3d27.002992!4d78.5824442!16s%2Fg%2F11bx2lr8r_?entry=ttu" target="_blank" rel="noreferrer">
                  <Button size="lg" className="shadow-xl bg-white/90 text-primary hover:bg-white font-bold rounded-xl px-6 text-sm backdrop-blur border border-white/20">
                    <MapPin className="mr-2 h-5 w-5" />
                    Open in Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
