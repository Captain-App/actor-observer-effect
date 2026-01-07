import { Plan, PlanTab } from '../../../src/data/plans/types';

export function renderPlanAsHtml(plan: Plan, tabId?: string): string {
  const selectedTabs = tabId 
    ? plan.tabs.filter(t => t.id === tabId)
    : plan.tabs;

  const content = selectedTabs.map(tab => `
    <article>
      <h2>${tab.title}</h2>
      ${tab.sections.map(section => `
        <section id="${section.id}">
          <h3>${section.title}</h3>
          ${section.subtitle ? `<h4>${section.subtitle}</h4>` : ''}
          <p>${section.content}</p>
        </section>
      `).join('\n')}
      ${tab.budgetConfig ? renderBudgetAsHtml(tab) : ''}
    </article>
  `).join('\n<hr />\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${plan.metadata.title} | CaptainApp Strategic Plans</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 3rem; }
    h3 { font-size: 1.5rem; margin-top: 2rem; }
    h4 { font-size: 1.1rem; color: #666; font-style: italic; margin-top: -1rem; margin-bottom: 1rem; }
    p { margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-weight: bold; }
    .profit-positive { color: #10b981; }
    .profit-negative { color: #ef4444; }
    hr { margin: 4rem 0; border: 0; border-top: 1px solid #eee; }
    .metadata { color: #666; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>${plan.metadata.title}</h1>
    <div class="metadata">
      <p>${plan.metadata.description}</p>
      <p>Date: ${plan.metadata.date}</p>
    </div>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} CaptainApp</p>
  </footer>
</body>
</html>
  `.trim();
}

function renderBudgetAsHtml(tab: PlanTab): string {
  if (!tab.budgetConfig) return '';
  
  // Use default values for budget calculation
  const initialValues = Object.fromEntries(
    tab.budgetConfig.assumptions.map(a => [a.id, a.defaultValue])
  );
  const data = tab.budgetConfig.calculate(initialValues);

  return `
    <section>
      <h3>Financial Projections (Year 1)</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue</th>
            <th>Expenses</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(m => `
            <tr>
              <td>${m.month}</td>
              <td>£${m.revenue.toLocaleString()}</td>
              <td>£${m.expenses.toLocaleString()}</td>
              <td class="${m.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                £${m.profit.toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

export function renderPlanAsMarkdown(plan: Plan, tabId?: string): string {
  const selectedTabs = tabId 
    ? plan.tabs.filter(t => t.id === tabId)
    : plan.tabs;

  const content = selectedTabs.map(tab => {
    let tabMd = `## ${tab.title}\n\n`;
    tabMd += tab.sections.map(section => {
      let sectionMd = `### ${section.title}\n`;
      if (section.subtitle) sectionMd += `*${section.subtitle}*\n\n`;
      sectionMd += `${section.content}\n\n`;
      return sectionMd;
    }).join('');
    
    if (tab.budgetConfig) {
      tabMd += `### Financial Projections (Year 1)\n\n`;
      tabMd += `| Month | Revenue | Expenses | Profit |\n`;
      tabMd += `|-------|---------|----------|--------|\n`;
      
      const initialValues = Object.fromEntries(
        tab.budgetConfig.assumptions.map(a => [a.id, a.defaultValue])
      );
      const data = tab.budgetConfig.calculate(initialValues);
      
      tabMd += data.map(m => 
        `| ${m.month} | £${m.revenue.toLocaleString()} | £${m.expenses.toLocaleString()} | £${m.profit.toLocaleString()} |`
      ).join('\n');
      tabMd += '\n\n';
    }
    
    return tabMd;
  }).join('---\n\n');

  return `# ${plan.metadata.title}\n\n${plan.metadata.description}\n\nDate: ${plan.metadata.date}\n\n${content}`.trim();
}

export function renderPlanAsJson(plan: Plan, tabId?: string): string {
  if (tabId) {
    const tab = plan.tabs.find(t => t.id === tabId);
    return JSON.stringify(tab || { error: 'Tab not found' }, null, 2);
  }
  return JSON.stringify(plan, null, 2);
}

