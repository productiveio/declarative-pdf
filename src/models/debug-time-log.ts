export default class TimeLogger {
  declare timeLogs: Map<string, number>;
  declare reports: Map<string, number>;
  declare isAggregated: boolean;
  declare session: { name: string; time: number };

  constructor(opts: { aggregated?: boolean } = {}) {
    this.timeLogs = new Map();
    this.reports = new Map();
    this.isAggregated = opts.aggregated ?? true;
  }

  startSession(desc: string) {
    this.timeLogs.clear();
    this.reports.clear();
    this.session = { name: desc, time: Date.now() };
  }

  endSession() {
    this.timeLogs.forEach((_val, key, _map) => {
      this.end(key);
    });

    if (this.timeLogs.size > 0) {
      this.timeLogs.clear();
    }

    const totalMs = Date.now() - this.session.time;
    const totalLen = Math.floor(Math.log10(Math.abs(totalMs))) + 1;

    if (this.isAggregated && this.reports.size) {
      // construct report
      const results = ['Time log report:', '================'];
      this.reports.forEach((val, key) => {
        const pctNum = totalMs ? (val / totalMs) * 100 : 0;
        const pct = pctNum.toFixed(2).padStart(6, ' ');
        const dur = val.toString().padStart(totalLen, ' ');
        results.push(`  ${pct}% | ${dur}ms | ${key}`);
      });
      const maxLen = Math.max(...results.map((r) => r.length));
      results.push('  '.padEnd(maxLen, '='));
      results.push(`            ${totalMs}ms | ${this.session.name}`);

      console.log(results.join('\n'));
      this.reports.clear();
      return;
    }

    console.log(`Time log: ${this.session.name} --==+> ${totalMs}ms`);
  }

  add(desc: string) {
    const now = Date.now();
    const log = this.timeLogs.get(desc);
    if (log) {
      this.handleLog(desc, now - log);
    }

    this.timeLogs.set(desc, now);
  }

  end(desc: string) {
    const now = Date.now();
    const log = this.timeLogs.get(desc);
    if (log) {
      this.handleLog(desc, now - log);
      this.timeLogs.delete(desc);
    }
  }

  private handleLog(desc: string, duration: number) {
    if (this.isAggregated) {
      this.reports.set(desc, duration);
    } else {
      console.log(`Time log: ${desc} --==+> ${duration}ms`);
    }
  }
}
