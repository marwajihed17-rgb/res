import { useEffect, useState } from 'react';
import { perf } from '../lib/perf';

export function PerfMonitor() {
  const [fps, setFps] = useState(0);
  const [mem, setMem] = useState(0);
  const [net, setNet] = useState<{ name: string; ms: number }[]>([]);
  const [marks, setMarks] = useState<{ name: string; ms: number }[]>([]);

  useEffect(() => {
    perf.startMonitoring();
    const id = setInterval(() => {
      const s = perf.getState();
      setFps(s.fps);
      setMem(s.memoryMB);
      setNet(s.net.slice(-5));
      setMarks(s.routeMarks.slice(-5));
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-[#1a1f2e]/90 border border-[#2a3144] rounded-lg p-3 text-xs min-w-[220px]">
      <div className="text-white">Perf</div>
      <div className="text-gray-400">FPS: {fps}</div>
      <div className="text-gray-400">Mem: {mem} MB</div>
      <div className="text-white mt-2">Recent Network</div>
      <ul className="text-gray-400">
        {net.map((n, i) => (
          <li key={i}>{n.name}: {Math.round(n.ms)}ms</li>
        ))}
      </ul>
      <div className="text-white mt-2">Marks</div>
      <ul className="text-gray-400">
        {marks.map((m, i) => (
          <li key={i}>{m.name}: {Math.round(m.ms)}ms</li>
        ))}
      </ul>
    </div>
  );
}