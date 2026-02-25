7import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useLocation } from "wouter";

export default function Home() {
  const [timeString, setTimeString] = useState("00:00:00");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    const timer = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="dark bg-black dark:bg-[#050505] font-['Rajdhani',sans-serif] min-h-screen flex items-center justify-center relative transition-colors duration-300 overflow-hidden"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        .glass-panel {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        .clip-corner-tl { clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px); }
        .clip-corner-br { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%); }
        .clip-tech { clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #00F2FF; border-radius: 2px; }
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .animate-scanline { animation: scanline 8s linear infinite; }
        .animate-spin-slow { animation: spin 12s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F2FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F2FF05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00F2FF]/20 animate-scanline"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
        <div className="mb-12 text-center relative group">
          <div className="absolute -inset-8 bg-[#00F2FF]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00F2FF]"></div>
            <span className="text-[#00F2FF] text-xs tracking-[0.5em] font-bold uppercase">Mission Control</span>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00F2FF]"></div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter relative">
            JEIKEI<span className="text-[#00F2FF]">STATION</span>
            <span className="absolute -top-4 -right-4 text-[10px] text-[#00F2FF] font-['JetBrains_Mono',monospace] animate-pulse">V3.0.4_BETA</span>
          </h1>
          <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-['JetBrains_Mono',monospace] text-[#00F2FF]/60 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-ping"></span>
              CORE STATUS: ONLINE
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-xs">schedule</span>
              {timeString}
            </div>
          </div>
        </div>

        <div className="w-full glass-panel bg-white/5 dark:bg-black/40 border border-[#00F2FF]/20 p-1 relative clip-tech shadow-[0_0_30px_rgba(0,242,255,0.05)]">
          <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#00F2FF]"></div>
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#00F2FF]"></div>
          
          <div className="bg-black/60 p-8 md:p-10">
            <div className="flex justify-between items-center mb-8 border-b border-[#00F2FF]/10 pb-4">
              <div>
                <h2 className="text-white text-xl font-bold tracking-wider uppercase">Autenticación</h2>
                <p className="text-[#00F2FF]/50 text-[10px] font-['JetBrains_Mono',monospace]">SECURITY CLEARANCE REQUIRED</p>
              </div>
              <div className="h-10 w-10 border border-[#00F2FF]/30 flex items-center justify-center text-[#00F2FF]">
                <span className="material-icons-round animate-spin-slow">settings</span>
              </div>
            </div>

            <SignedOut>
              <div className="space-y-6">
                <p className="text-[#00F2FF]/70 text-sm font-['JetBrains_Mono',monospace] leading-relaxed">
                  Bienvenido al centro de comando. Inicia sesión para acceder a la gestión de agentes y misiones.
                </p>
                <SignInButton mode="modal">
                  <button className="w-full relative overflow-hidden group bg-[#00F2FF]/20 hover:bg-[#00F2FF]/30 border border-[#00F2FF] text-[#00F2FF] font-bold py-4 px-4 rounded-none transition-all duration-300 shadow-[0_0_10px_rgba(0,242,255,0.1)] hover:shadow-[0_0_10px_rgba(0,242,255,0.5),0_0_20px_rgba(0,242,255,0.3)] clip-corner-br mt-4">
                    <span className="relative z-10 flex items-center justify-center gap-2 tracking-[0.2em] font-['Rajdhani',sans-serif] text-lg group-hover:text-white transition-colors uppercase">
                      Iniciar Sesión
                      <span className="material-icons-round text-sm animate-pulse">chevron_right</span>
                    </span>
                    <div className="absolute inset-0 bg-[#00F2FF] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0 opacity-20"></div>
                  </button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="space-y-6 text-center">
                <div className="flex justify-center mb-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <p className="text-white font-['JetBrains_Mono',monospace] text-sm uppercase">
                  Sesión Activa // Acceso Concedido
                </p>
                <button 
                  onClick={() => setLocation("/dashboard")}
                  className="w-full relative overflow-hidden group bg-[#00F2FF]/20 hover:bg-[#00F2FF]/30 border border-[#00F2FF] text-[#00F2FF] font-bold py-4 px-4 rounded-none transition-all duration-300 shadow-[0_0_10px_rgba(0,242,255,0.1)] hover:shadow-[0_0_10px_rgba(0,242,255,0.5),0_0_20px_rgba(0,242,255,0.3)] clip-corner-br mt-4"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-[0.2em] font-['Rajdhani',sans-serif] text-lg group-hover:text-white transition-colors uppercase">
                    Ir al Dashboard
                    <span className="material-icons-round text-sm">dashboard</span>
                  </span>
                  <div className="absolute inset-0 bg-[#00F2FF] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0 opacity-20"></div>
                </button>
              </div>
            </SignedIn>
          </div>
          
          <div className="h-2 w-full bg-black/40 flex items-center justify-center gap-1 border-t border-[#00F2FF]/20">
            <div className="h-1 w-10 bg-[#00F2FF]/40"></div>
            <div className="h-1 w-1 bg-[#00F2FF]/40"></div>
            <div className="h-1 w-1 bg-[#00F2FF]/40"></div>
            <div className="h-1 w-10 bg-[#00F2FF]/40"></div>
          </div>
        </div>

        <div className="mt-8 md:mt-12 w-full max-w-2xl h-16 relative hidden md:block" style={{ perspective: "1000px" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#00F2FF]/5 to-transparent border border-[#00F2FF]/20 rounded-xl shadow-[0_0_10px_rgba(0,242,255,0.5),0_0_20px_rgba(0,242,255,0.3)] opacity-50" style={{ transform: "rotateX(60deg)" }}>
            <div className="w-full h-full bg-[linear-gradient(to_right,#00F2FF10_1px,transparent_1px),linear-gradient(to_bottom,#00F2FF10_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          </div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] font-['JetBrains_Mono',monospace] text-[#00F2FF]/40 whitespace-nowrap uppercase">
            System Integrity Check: Pass // Connection Secure
          </div>
        </div>
      </div>
    </div>
  );
}
