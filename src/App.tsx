import { useEffect, useState } from "react";
import { prefetchAuthData } from "./lib/auth";
import { PerfMonitor } from "./components/PerfMonitor";
import { perf } from "./lib/perf";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { InvoiceProcessing } from "./components/InvoiceProcessing";
import { KDRProcessing } from "./components/KDRProcessing";
import { GAProcessing } from "./components/GAProcessing";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "login" | "dashboard" | "invoice" | "kdr" | "ga"
  >("login");
  const [authorized, setAuthorized] = useState<Array<"invoice" | "kdr" | "ga">>([]);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('authorizedV1');
      if (saved) setAuthorized(JSON.parse(saved));
    } catch {}
    const applyHash = () => {
      const h = window.location.hash.replace('#', '');
      if (h === '/modules') setCurrentPage('dashboard');
      else if (h === '/chat/module1') setCurrentPage('invoice');
      else if (h === '/chat/module2') setCurrentPage('ga');
      else if (h === '/chat/module3') setCurrentPage('kdr');
      else setCurrentPage('login');
    };
    window.addEventListener('hashchange', applyHash);
    applyHash();
    prefetchAuthData();
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const go = (page: "login" | "dashboard" | "invoice" | "kdr" | "ga") => {
    perf.startMark('navigate');
    setCurrentPage(page);
    if (page === 'dashboard') window.location.hash = '/modules';
    else if (page === 'invoice') window.location.hash = '/chat/module1';
    else if (page === 'ga') window.location.hash = '/chat/module2';
    else if (page === 'kdr') window.location.hash = '/chat/module3';
    else window.location.hash = '/login';
    perf.endMark('navigate');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a1233] to-[#0f1419] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4A90F5] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C74AFF] opacity-10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#5EC5E5] opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {import.meta.env.DEV && <PerfMonitor />}
        {currentPage === "login" && (
          <LoginPage
            onLogin={(auth, user) => {
              setAuthorized(auth);
              setUsername(user);
              try { sessionStorage.setItem('authorizedV1', JSON.stringify(auth)); } catch {}
              go("dashboard");
            }}
          />
        )}
        {currentPage === "dashboard" && (
          <Dashboard
            authorized={authorized}
            onNavigate={(page) => go(page)}
            onLogout={() => {
              setAuthorized([]);
              go("login");
            }}
          />
        )}
        {currentPage === "invoice" && authorized.includes('invoice') && (
          <InvoiceProcessing
            onBack={() => go("dashboard")}
            onLogout={() => go("login")}
            user={username}
            conversationId={username}
          />
        )}
        {currentPage === "kdr" && authorized.includes('kdr') && (
          <KDRProcessing
            onBack={() => go("dashboard")}
            onLogout={() => go("login")}
            user={username}
            conversationId={username}
          />
        )}
        {currentPage === "ga" && authorized.includes('ga') && (
          <GAProcessing
            onBack={() => go("dashboard")}
            onLogout={() => go("login")}
            user={username}
            conversationId={username}
          />
        )}
      </div>
    </div>
  );
}
