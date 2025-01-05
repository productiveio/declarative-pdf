interface TimeObject {
  name: string;
  start: number;
  duration: number;
  children?: TimeObject[];
}

interface TimeNode {
  defaultName: string;
  current: TimeObject;
  report: TimeObject[];
  parent?: TimeNode;
  child?: TimeNode;
}

function buildReportLine(
  obj: TimeObject,
  lvl: 0 | 1 | 2,
  totalMs: number,
  totalLen: number
) {
  const PCT_PREFIX = ['  ', '  ‣ ', '        ...'];
  const PCT_SUFFIX = ['%  ', '%', ''];
  const NAME_PREFIX = ['', ' ', '  '];
  const pctNum = totalMs ? (obj.duration / totalMs) * 100 : 0;
  const pct = lvl === 2 ? '' : pctNum.toFixed(2).padStart(6, ' ');
  const dur = obj.duration.toString().padStart(totalLen, ' ');

  return `${PCT_PREFIX[lvl]}${pct}${PCT_SUFFIX[lvl]} | ${dur}ms | ${NAME_PREFIX[lvl]}${obj.name}`;
}

export default class TimeLogger {
  private _nodes: Map<string, TimeNode> = new Map();

  constructor() {
    this.setupNode('session');
    this.setupNode('group', 'session');
    this.setupNode('subgroup', 'group');
    this.setupNode('item', 'subgroup');
  }

  private setupNode(key: string, parentKey?: string) {
    const parent = parentKey ? this._nodes.get(parentKey) : undefined;
    const defaultName = key[0].toUpperCase() + key.slice(1);
    const timeNode = {
      defaultName,
      current: { name: '', start: 0, duration: 0 },
      report: [],
      parent,
    };

    if (parent) parent.child = timeNode;
    this._nodes.set(key, timeNode);
  }

  private handleNode(key: string) {
    const node = this._nodes.get(key)!;

    return {
      start: (name: string) => {
        this.endNode(node);
        this.startNode(node, name);
      },
      end: () => this.endNode(node),
    };
  }

  private startNode(node: TimeNode, name?: string) {
    if (node.parent && !node.parent.current.name) {
      this.startNode(node.parent);
    }


    node.current.name = name || node.defaultName;
    node.current.start = Date.now();
  }

  private endNode(node: TimeNode) {
    if (!node.current.name) return;
    if (node.child) this.endNode(node.child);

    node.current.duration = Date.now() - node.current.start;
    const reportNode = { ...node.current };

    // Handle children
    if (node.child) {
      this.endNode(node.child);
      reportNode.children = [...node.child.report];
      node.child.report = [];
    }

    node.report.push(reportNode);
    this.resetTimeObject(node.current);
  }

  // Public methods remain similar but use handleNode
  session() {
    return this.handleNode('session');
  }
  group() {
    return this.handleNode('group');
  }
  subgroup() {
    return this.handleNode('subgroup');
  }
  item() {
    return this.handleNode('item');
  }

  private resetTimeObject(timeObj: TimeObject) {
    timeObj.name = '';
    timeObj.start = 0;
    timeObj.duration = 0;
  }

  getReport() {
    const session = this._nodes.get('session')!.report[0];
    const totalMs = session.duration;
    const totalLen = totalMs.toString().length;

    const report = [
      'Time log report:',
      '================',
      ...(session.children ?? []).flatMap((group) => [
        buildReportLine(group, 0, totalMs, totalLen),
        ...(group.children ?? []).flatMap((subgroup) => [
          buildReportLine(subgroup, 1, group.duration, totalLen),
          ...(subgroup.children ?? []).map((item) =>
            buildReportLine(item, 2, 0, totalLen)
          ),
        ]),
      ]),
    ];

    const lineLen = report.reduce((max, line) => Math.max(max, line.length), 0);
    report.push('  '.padEnd(lineLen, '='));
    report.push(`              ${totalMs}ms | ${session.name}`);

    return report.join('\n');
  }
}
