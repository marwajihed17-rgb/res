type NetMetric = { name: string; ms: number };

const state = {
  fps: 0,
  memoryMB: 0,
  net: [] as NetMetric[],
  routeMarks: [] as { name: string; ms: number }[],
};

function trackFPS(callback: (fps: number) => void) {
  let last = performance.now();
  let frames = 0;
  let lastFpsUpdate = performance.now();
  function loop() {
    const now = performance.now();
    frames++;
    if (now - lastFpsUpdate >= 1000) {
      const fps = Math.round((frames * 1000) / (now - lastFpsUpdate));
      callback(fps);
      frames = 0;
      lastFpsUpdate = now;
    }
    last = now;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function readMemoryMB() {
  const anyPerf: any = performance as any;
  const mem = anyPerf.memory;
  if (mem && mem.usedJSHeapSize) {
    return Math.round(mem.usedJSHeapSize / 1024 / 1024);
  }
  return 0;
}

export const perf = {
  startMark(name: string) {
    performance.mark(`${name}_start`);
  },
  endMark(name: string) {
    performance.mark(`${name}_end`);
    const measureName = `${name}_measure`;
    performance.measure(measureName, `${name}_start`, `${name}_end`);
    const entries = performance.getEntriesByName(measureName);
    const last = entries[entries.length - 1];
    if (last) state.routeMarks.push({ name, ms: last.duration });
  },
  recordNet(name: string, ms: number) {
    state.net.push({ name, ms });
    if (ms > 2000) console.warn('net_slow', { name, ms: Math.round(ms) });
  },
  startMonitoring() {
    trackFPS((fps) => {
      state.fps = fps;
      if (fps < 30) console.warn('fps_low', { fps });
    });
    setInterval(() => {
      state.memoryMB = readMemoryMB();
    }, 2000);
  },
  getState() {
    return state;
  },
};