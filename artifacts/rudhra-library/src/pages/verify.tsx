import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ShieldCheck, Search, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useVerifyStudentCard, getVerifyStudentCardQueryKey } from "@workspace/api-client-react";

export default function Verify() {
  const [cardIdInput, setCardIdInput] = useState("");
  const [submittedCardId, setSubmittedCardId] = useState("");
  
  // Keep history
  const [history, setHistory] = useState<Array<{id: string, time: Date, valid: boolean}>>([]);

  const { data: result, isLoading, isError, error, refetch } = useVerifyStudentCard(submittedCardId, {
    query: {
      enabled: !!submittedCardId,
      queryKey: getVerifyStudentCardQueryKey(submittedCardId),
      retry: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardIdInput.trim().length === 0) return;
    
    // Auto-prefix if user just types the number part (e.g., 0001 -> RL-2026-0001)
    let finalId = cardIdInput.trim().toUpperCase();
    if (/^\d+$/.test(finalId)) {
      finalId = `RL-${new Date().getFullYear()}-${finalId.padStart(4, '0')}`;
      setCardIdInput(finalId);
    }
    
    setSubmittedCardId(finalId);
  };

  useEffect(() => {
    if (result && submittedCardId) {
      setHistory(prev => {
        // Keep last 5
        const newHistory = [{ id: submittedCardId, time: new Date(), valid: result.valid }, ...prev];
        return newHistory.slice(0, 5);
      });
      // Clear input for next scan
      setCardIdInput("");
    }
  }, [result, submittedCardId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl mx-auto space-y-8 text-center">
          
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight">Verify Entry</h1>
            <p className="text-muted-foreground text-lg">Scan or type the student card ID to verify membership</p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto items-center space-x-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="e.g. RL-2026-0001"
              value={cardIdInput}
              onChange={(e) => setCardIdInput(e.target.value)}
              className="pl-12 h-14 text-lg font-mono font-bold tracking-wider"
              autoFocus
            />
            <Button type="submit" size="lg" className="h-14 px-8 bg-primary">
              Verify
            </Button>
          </form>

          <div className="min-h-[300px] w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="p-8 border-dashed shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </Card>
                </motion.div>
              ) : isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                >
                  <Card className="p-8 border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <XCircle className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Card Not Found</h2>
                      <p className="text-red-600/80">The ID {submittedCardId} does not exist in our database.</p>
                    </div>
                  </Card>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                >
                  <Card className={`overflow-hidden shadow-2xl border-2 ${result.valid ? 'border-green-500' : 'border-red-500'}`}>
                    <div className={`p-6 text-center text-white ${result.valid ? 'bg-green-600' : 'bg-red-600'}`}>
                      <div className="flex justify-center mb-4">
                        {result.valid ? (
                          <CheckCircle2 className="w-16 h-16" />
                        ) : (
                          <XCircle className="w-16 h-16" />
                        )}
                      </div>
                      <h2 className="text-3xl font-bold mb-1">
                        {result.valid ? 'Access Granted' : 'Access Denied'}
                      </h2>
                      <p className="text-white/90 text-lg font-medium">{result.message}</p>
                    </div>
                    
                    {result.student && (
                      <CardContent className="p-6 bg-card text-left">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-serif font-bold">
                            {result.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-2xl font-serif font-bold">{result.student.name}</h3>
                            <div className="font-mono text-muted-foreground text-sm">{result.student.cardId}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Clock className="w-4 h-4 mr-2" /> Shift
                            </div>
                            <div className="font-bold text-lg">{result.student.shift}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Calendar className="w-4 h-4 mr-2" /> Valid Until
                            </div>
                            <div className={`font-bold text-lg ${!result.valid ? 'text-red-600' : ''}`}>
                              {format(new Date(result.student.validUntil), "MMM d, yyyy")}
                            </div>
                          </div>
                          {result.student.seatNumber && (
                            <div className="space-y-1 col-span-2">
                              <div className="flex items-center text-muted-foreground text-sm">
                                Seat Number
                              </div>
                              <div className="font-bold text-xl text-primary">{result.student.seatNumber}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <div className="text-muted-foreground pt-12">
                  <div className="font-serif italic">"Ready to scan..."</div>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* History */}
          {history.length > 0 && (
            <div className="mt-12 text-left max-w-md mx-auto w-full">
              <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Recent Scans</h4>
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="font-mono font-medium">{item.id}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{format(item.time, "HH:mm:ss")}</span>
                      {item.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
