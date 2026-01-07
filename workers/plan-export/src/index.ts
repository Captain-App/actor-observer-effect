import { Hono } from 'hono';
import { plans, planData, Plan } from '../../../src/data/plans';
import { renderPlanAsHtml, renderPlanAsMarkdown, renderPlanAsJson } from './render';

const app = new Hono();

const SHARED_SECRET = 'article_access_2025';

// Build plans lookup from the shared data
const plansLookup: Record<string, Plan> = Object.fromEntries(
  plans.map(metadata => [
    metadata.id,
    { metadata, tabs: planData[metadata.id] }
  ])
);

app.get('/export/:planId', async (c) => {
  const planId = c.req.param('planId');
  const accessToken = c.req.query('access_token') || c.req.query('key') || c.req.query('access');
  const format = c.req.query('format') || 'html';
  const tabId = c.req.query('tab');

  // 1. Auth check
  if (accessToken !== SHARED_SECRET) {
    return c.text('Unauthorized', 401);
  }

  // 2. Find plan
  const plan = plansLookup[planId];
  if (!plan) {
    return c.text('Plan not found', 404);
  }

  // 3. Render based on format
  switch (format.toLowerCase()) {
    case 'md':
    case 'markdown':
      return c.text(renderPlanAsMarkdown(plan, tabId));
    
    case 'json':
      c.header('Content-Type', 'application/json');
      return c.text(renderPlanAsJson(plan, tabId));
    
    case 'html':
    default:
      return c.html(renderPlanAsHtml(plan, tabId));
  }
});

export default app;

