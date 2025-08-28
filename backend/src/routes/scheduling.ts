import { Router } from 'express';
import fs from 'fs';
import path from 'path';

type Schedule = {
  id: string;
  name: string;
  cron: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  task: { type: string; config: Record<string, any> };
  notify?: { slackWebhookUrl?: string; emails?: string[] };
  createdAt: string;
  updatedAt: string;
};

const router = Router();

const dataDir = path.join(process.cwd(), 'uploads', 'data');
const storeFile = path.join(dataDir, 'schedules.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, '[]');
}

function readAll(): Schedule[] {
  ensureStore();
  const raw = fs.readFileSync(storeFile, 'utf-8');
  return JSON.parse(raw) as Schedule[];
}

function writeAll(items: Schedule[]) {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(items, null, 2));
}

router.get('/', (_req, res) => {
  try {
    const items = readAll();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to read schedules' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, cron, isActive = true, task, notify } = req.body || {};
    if (!name || !cron || !task || !task.type) {
      return res.status(400).json({ success: false, error: 'name, cron and task.type are required' });
    }
    const now = new Date().toISOString();
    const items = readAll();
    const item: Schedule = {
      id: 'sch_' + Date.now(),
      name,
      cron,
      isActive: Boolean(isActive),
      task: { type: String(task.type), config: task.config || {} },
      notify: notify || {},
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    writeAll(items);
    res.status(201).json({ success: true, data: item });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create schedule' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const items = readAll();
    const next = items.filter(i => i.id !== req.params.id);
    if (next.length === items.length) return res.status(404).json({ success: false, error: 'Not found' });
    writeAll(next);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete schedule' });
  }
});

// Simulate a run and optionally send Slack notification
router.post('/:id/test-run', async (req, res) => {
  try {
    const items = readAll();
    const item = items.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });

    const runId = 'run_' + Date.now();
    const now = new Date().toISOString();

    // In a real worker, we would branch by task.type and execute.
    // Here we simulate success and optionally post to Slack webhook.
    let slackStatus: 'skipped' | 'ok' | 'failed' = 'skipped';
    let slackMessage: string | undefined;
    const webhook = item.notify?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (webhook) {
      try {
        const payload = JSON.stringify({ text: `Scheduled task test-run succeeded: ${item.name} (${item.task.type}) at ${now}` });
        const url = new URL(webhook);
        await new Promise<void>((resolve) => {
          const reqH = https.request({ method: 'POST', hostname: url.hostname, path: url.pathname + url.search, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (r) => {
            slackStatus = r.statusCode && r.statusCode >= 200 && r.statusCode < 300 ? 'ok' : 'failed';
            slackMessage = `HTTP ${r.statusCode}`;
            r.on('data', () => {}); r.on('end', resolve);
          });
          reqH.on('error', (err) => { slackStatus = 'failed'; slackMessage = err.message; resolve(); });
          reqH.write(payload); reqH.end();
        });
      } catch (e: any) {
        slackStatus = 'failed';
        slackMessage = e?.message || 'Slack error';
      }
    }

    item.lastRunAt = now;
    item.updatedAt = now;
    writeAll(items);

    res.json({ success: true, data: { runId, at: now, slack: { status: slackStatus, message: slackMessage } } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to test-run schedule' });
  }
});

export default router;

