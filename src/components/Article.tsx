import React, { useMemo } from 'react';

interface HighlightableTextProps {
  text: string;
  currentWordIndex: number | null;
  baseIndex: number;
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ text, currentWordIndex, baseIndex }) => {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  
  let wordCounter = 0;

  return (
    <>
      {words.map((part, i) => {
        if (part.trim() === '') return part;
        
        const currentIndex = baseIndex + wordCounter;
        const isHighlighted = currentWordIndex === currentIndex;
        wordCounter++;

        return (
          <span
            key={i}
            id={isHighlighted ? 'current-reading-word' : undefined}
            className={isHighlighted ? 'bg-yellow-400/30 text-primary-foreground font-bold rounded px-0.5 transition-colors duration-150' : ''}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

interface ArticleProps {
  currentWordIndex: number | null;
}

const Article: React.FC<ArticleProps> = ({ currentWordIndex }) => {
  const sections = [
    {
      id: "intro",
      title: "CaptainApp: The Truth in the Data",
      subtitle: "Removing decision latency for the modern UK SME.",
      content: "Picture a typical UK SME on a Tuesday morning. The Managing Director has one question in their head: 'Are we actually doing alright?' Not vibes. Not 'it feels busy'. The real version. What’s cash looking like, right now? Which invoices are drifting? Who owes us money, and how late are they? Which subscriptions are creeping up month-on-month? If we push on hiring, do we stay safe—or do we wobble? And the uncomfortable truth is: the answers are in the business already... just scattered across systems."
    },
    {
      id: "latency",
      title: "Fragmentation and decision latency",
      content: "Xero knows the truth about invoices and debtors. Stripe knows revenue and churn. WhatsApp is where people actually respond. And the problem isn’t a lack of data. It’s friction. It’s fragmentation. It’s decision latency. CaptainApp’s agent platform is being built to remove that latency. Not by adding another dashboard, but by giving decision makers a simple interface they already use—WhatsApp—and letting them ask plain-English questions that get answered with grounded, auditable summaries."
    },
    {
      id: "approach",
      title: "Approaching agents differently",
      content: "We’re not building a chatbot that guesses. We’re building an accountable decision layer—an agent that can show its working, and rewind its own history. We’ve been leaning hard into event-sourced thinking—especially the idea that the most valuable thing you can store isn’t the current state... it’s how you got there. Internally, we’ve discussed building systems around a ledger of intents—a record of 'what the user meant to do'—and the resulting directives and events, so you can audit, replay, and even fast-forward a system through time."
    },
    {
      id: "traceability",
      title: "Traceability, Governance, Reversibility",
      content: "This matters because agents are just software that takes actions on your behalf. And if software takes actions on your behalf, you need Traceability: what did it do, and why? Governance: who approved it, and under what policy? And Reversibility: can you undo, compensate, or correct it? In other words: audit logs shouldn’t be a compliance afterthought. They should be the product."
    },
    {
      id: "platform",
      title: "What the platform will do",
      content: "The inward-facing agent gives you the truth. A director messages: 'Who owes us money right now?' The agent pulls from connected systems like Xero and Stripe, aggregates, and replies with a short answer, a breakdown, and a link to a visual timeline. The outward-facing agent gets the money in. SMEs often don't have time to chase debtors consistently. We’ll offer outward-reaching agents that can send debtor reminders carefully and compliantly: 'Invoice #1042 is now overdue—would you like to pay by card or bank transfer?' This is controlled, reputable comms—more like an assistant than a debt collector."
    },
    {
      id: "interface",
      title: "WhatsApp first, but not WhatsApp-only",
      content: "WhatsApp is our primary front door, but the rules can change. Meta's updated terms effective January 2026 require specific customer service automation. Our strategy is WhatsApp for adoption, but a CaptainApp portal as the control plane. The portal is where you connect integrations, control permissions, manage billing, and review the agent's story-like history. A normal audit log is a crime against the human attention span. Ours reads like a story: 'Jack asked: What’s overdue? Agent pulled invoices from Xero. Agent drafted reminders. Admin approved. Messages sent.'"
    },
    {
      id: "execution",
      title: "Execution: OpenCode and Cloudflare",
      content: "If you want agents that are safe and scalable, you need a strong execution model. Cloudflare Workers give us isolates—lightweight, fast-starting sandboxed environments. Every SME gets a logically isolated agent runtime. OpenCode becomes the agent framework we build on top—our orchestration layer and tool system—while Cloudflare provides the sandbox and distribution. Compute scales elastically—without forcing customers into 'Kubernetes brain'."
    },
    {
      id: "roadmap",
      title: "The Roadmap",
      content: "Stage 1 is the Foundation: defining the intent protocol and implementing the audit timeline early. Stage 2 is Integrations: starting with Xero and Stripe OAuth workflows. Stage 3 is the Channel: WhatsApp via Twilio with human-in-the-loop approvals. Stage 4 is the Portal: onboarding, roles, and Stripe-based billing. Stage 5 is Hosted Execution: deploying tenant agents onto Cloudflare isolates. Finally, Stage 6 is Solutions: providing packaged outcomes like reduced aged receivables and faster reporting."
    },
    {
      id: "conclusion",
      title: "Packaged outcomes, not AI",
      content: "We're not just 'integrating Xero'. We're reducing your aged receivables by 18% in 60 days. We're cutting month-end reporting time from 2 days to 30 minutes. We're stopping surprise subscription creep. The agent becomes a productised workflow, sold as an outcome to UK SMEs. This is the future of CaptainApp."
    },
    {
      id: "appendix-title",
      title: "Appendix 1: captainapp.co.uk",
      subtitle: "What we have now",
      content: "To understand the foundation of CaptainApp, we look at the existing homepage architecture that powers captainapp.co.uk. This is a battle-tested production environment comprising over 1,200 files and 200 edge functions, designed for high-stakes agent orchestration."
    },
    {
      id: "domain-frontend",
      title: "Domain: Frontend & Presentation",
      content: "The frontend is a React 18 application built on a Domain-Driven Design (DDD) structure. It features a custom 'Artefact' system for real-time document collaboration (Tiptap), complex Graphviz-powered conversation visualizations, and a robust Admin control plane for managing multi-tenant organizations and project hierarchies. State is managed via specialized contexts and a massive library of over 100 custom hooks for everything from presence tracking to real-time Excel-diffing."
    },
    {
      id: "domain-backend",
      title: "Domain: Backend & Serverless",
      content: "The backbone is Supabase, running a highly optimized PostgreSQL schema with over 500 migrations. The logic layer consists of 250+ Deno Edge Functions. These aren't just endpoints; they are specialized workers handling everything from real-time PDF generation and SendGrid domain verification to complex financial aggregations for Xero and Stripe."
    },
    {
      id: "domain-ai",
      title: "Domain: AI Orchestration",
      content: "AI isn't a bolt-on; it's the core. The system runs an 'Agent Town' simulation with specialized personas (CEO, CFO, COO, SRE) that collaborate via the Model Context Protocol (MCP). These agents have access to a rich toolbelt: executing Python in sandboxes, generating SQL, and even launching 'Cursor Agents' to perform code changes autonomously."
    },
    {
      id: "domain-integrations",
      title: "Domain: Integrations & Infrastructure",
      content: "Infrastructure is truly multi-cloud. It maps business relationships into Neo4j for graph-based insights, synchronizes deep HR data from Rippling, and bridges plain-text WhatsApp conversations via Twilio. The entire stack is enforced with Vitest and Playwright, ensuring that every automated reminder or financial summary is grounded and accurate."
    }
  ];

  // Map words to global indices
  let globalWordCounter = 0;

  return (
    <article className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      {sections.map((section) => {
        const titleIndex = globalWordCounter;
        globalWordCounter += section.title.split(/\s+/).length;

        const subtitleIndex = globalWordCounter;
        if (section.subtitle) {
          globalWordCounter += section.subtitle.split(/\s+/).length;
        }

        const contentIndex = globalWordCounter;
        globalWordCounter += section.content.split(/\s+/).length;

        return (
          <section key={section.id} id={section.id} className="space-y-6">
            <header className="space-y-4">
              <h2 className={section.id === 'intro' ? "text-5xl font-bold tracking-tight" : "text-3xl font-semibold"}>
                <HighlightableText text={section.title} currentWordIndex={currentWordIndex} baseIndex={titleIndex} />
              </h2>
              {section.subtitle && (
                <p className="text-xl text-muted-foreground italic">
                  <HighlightableText text={section.subtitle} currentWordIndex={currentWordIndex} baseIndex={subtitleIndex} />
                </p>
              )}
            </header>
            <p className="text-lg leading-relaxed text-muted-foreground/90">
              <HighlightableText text={section.content} currentWordIndex={currentWordIndex} baseIndex={contentIndex} />
            </p>
            
            {section.id === 'execution' && (
              <div className="bg-muted p-8 rounded-lg font-mono text-sm overflow-x-auto mt-6">
                <pre>
{`[Decision Maker] <-> [WhatsApp / Portal]
                         |
                         v
              [CaptainApp Control Plane]
                         |
              +----------+----------+
              |                     |
     [OpenCode Agent]      [Intent Ledger]
              |                     |
     +--------+--------+      [Audit Timeline]
     |        |        |
 [Xero] [Stripe] [Twilio]`}
                </pre>
              </div>
            )}
          </section>
        );
      })}
    </article>
  );
};

export default Article;
