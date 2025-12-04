import { FileText, FileBarChart, BarChart3, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png';

interface DashboardProps {
  authorized: Array<'invoice' | 'kdr' | 'ga'>;
  onNavigate: (page: 'invoice' | 'kdr' | 'ga' | 'kdrInvoice' | 'kdrSellout') => void;
  onLogout: () => void;
}

export function Dashboard({ authorized, onNavigate, onLogout }: DashboardProps) {
  const cards = [
    {
      id: 'invoice' as const,
      icon: FileText,
      title: 'Invoice Processing',
      description: 'Dedicated general invoice Chat',
    },
    {
      id: 'kdr' as const,
      icon: FileBarChart,
      title: 'KDR Report Generator',
      description: 'KDR Report Creation and Analysis',
    },
    {
      id: 'ga' as const,
      icon: BarChart3,
      title: 'GA Processing',
      description: 'Analytics and reporting automation',
    },
    {
      id: 'kdrInvoice' as const,
      icon: FileText,
      title: 'KDRs Invoice Processing',
      description: 'Dedicated KDR invoice chat',
    },
    {
      id: 'kdrSellout' as const,
      icon: SelloutIcon,
      title: 'KDRs Sellout Processing',
      description: 'Dedicated KDR sellout chat',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Retaam Solutions" className="h-10" />
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-white hover:bg-[#1a1f2e] gap-2 h-9 px-3"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            const isEnabled = card.id === 'kdrInvoice' || card.id === 'kdrSellout' ? authorized.includes('kdr') : authorized.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => isEnabled && onNavigate(card.id)}
                disabled={!isEnabled}
                className="bg-[#1a1f2e]/80 backdrop-blur-sm border border-[#2a3144] rounded-lg p-6 hover:border-[#3a4154] transition-all group hover:bg-[#1a1f2e]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{card.title}</h3>
                    <p className="text-gray-400 text-sm">{card.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
      
      {/* Signature */}
      <div className="fixed bottom-4 right-4">
        <div className="flex items-center gap-4">
          <div className="h-0.5 w-64 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] animated-gradient"></div>
          <div className="text-right">
            <p className="text-gray-400 text-lg">PAA--Solutions Tool</p>
            <p className="text-gray-500 text-base">WWW.PAA-Solutions.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function SelloutIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <defs>
        <linearGradient id="dashg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A90F5" />
          <stop offset="100%" stopColor="#C74AFF" />
        </linearGradient>
      </defs>
      <rect x="4" y="3" width="14" height="18" rx="2" fill="#1a1f2e" stroke="url(#dashg1)" strokeWidth="1.5" />
      <circle cx="10" cy="8" r="3" fill="none" stroke="url(#dashg1)" strokeWidth="1.5" />
      <path d="M10 8 L10 5 A3 3 0 0 1 13 8 Z" fill="#4A90F5" />
      <rect x="6" y="12" width="2" height="4" rx="0.5" fill="#4A90F5" />
      <rect x="9" y="11" width="2" height="5" rx="0.5" fill="#6FB3FF" />
      <rect x="12" y="10" width="2" height="6" rx="0.5" fill="#C74AFF" />
      <path d="M17 7 L21 11 L20 12 L16 8 Z" fill="#ff6fa8" stroke="#d45597" strokeWidth="0.8" />
      <rect x="19.4" y="10.4" width="1.6" height="1.6" transform="rotate(45 20.2 11.2)" fill="#ffd1e4" />
    </svg>
  );
}
