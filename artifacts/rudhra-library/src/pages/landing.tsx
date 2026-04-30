import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Phone, Clock, ShieldCheck, BookOpen, Users, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero.png";
import booksImg from "@/assets/books.png";
import cubicleImg from "@/assets/cubicle.png";

const shifts = [
  { name: "Morning", time: "6 AM - 10 AM", desc: "Start your day with deep, uninterrupted focus." },
  { name: "Afternoon", time: "10 AM - 2 PM", desc: "Perfect for a midday study session." },
  { name: "Evening", time: "2 PM - 6 PM", desc: "Wind down your day with productive reading." },
  { name: "Night", time: "6 PM - 11 PM", desc: "For the night owls who prefer absolute silence." },
  { name: "Full Day", time: "6 AM - 11 PM", desc: "Ultimate flexibility for serious scholars." },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Immersive Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md border-b shadow-sm py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className={`h-8 w-8 ${scrolled ? "text-primary" : "text-white"}`} />
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
            <Link href="/admin">
              <Button className={scrolled ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white text-primary hover:bg-white/90"}>
                Admin Login
              </Button>
            </Link>
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
              Premium reading and studying environment in Agra. Designed for academic excellence.
              Founded by Ankul Kumar.
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
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Visit Us</h2>
            <p className="text-muted-foreground text-lg">Located conveniently in Agra. Drop by to experience the environment yourself.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8 bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <div className="lg:col-span-2 p-10 flex flex-col justify-center space-y-8 bg-primary text-primary-foreground">
              <div>
                <h3 className="font-serif text-2xl font-bold mb-6 text-white">Contact Info</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 shrink-0 text-secondary mt-1" />
                    <div>
                      <div className="font-bold text-lg mb-1 text-white">Address</div>
                      <p className="text-primary-foreground/80 leading-relaxed">Agra, Uttar Pradesh<br/>India</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 shrink-0 text-secondary mt-1" />
                    <div>
                      <div className="font-bold text-lg mb-1 text-white">Phone</div>
                      <div className="flex flex-col space-y-1">
                        <a href="tel:+917088830367" className="text-primary-foreground/80 hover:text-white transition-colors">+91 7088830367</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-primary-foreground/20">
                <div className="text-sm text-primary-foreground/80 mb-1">Owner & Founder</div>
                <div className="text-xl font-serif font-bold text-white">Ankul Kumar</div>
              </div>
            </div>
            
            <div className="lg:col-span-3 min-h-[400px] relative">
              <iframe 
                src="https://www.google.com/maps?q=27.0032965,78.5823932&hl=en&z=18&output=embed" 
                className="absolute inset-0 w-full h-full border-0" 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Rudhra Library Location"
              />
              <div className="absolute bottom-6 right-6">
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=27.0032965,78.5823932" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Button size="lg" className="shadow-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold rounded-full px-8">
                    <MapPin className="mr-2 h-5 w-5" />
                    Get Directions
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
