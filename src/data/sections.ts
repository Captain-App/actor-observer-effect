export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
}

export const sections: Section[] = [
  {
    id: "intro",
    title: "The Truth in the Data",
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
    content: "We're not just 'integrating Xero'. We're reducing your aged receivables by 18% in 60 days. We're cutting month-end reporting time from 2 days to 30 minutes. We're topping surprise subscription creep. The agent becomes a productised workflow, sold as an outcome to UK SMEs. This is the future of CaptainApp."
  },
  {
    id: "appendix-1",
    title: "Appendix 1: captainapp.co.uk",
    subtitle: "A candid inventory of experiments",
    content: "Let's be honest about what captainapp.co.uk actually is today. It's not a polished product with a coherent user journey. It's a collection of powerful but disconnected experiments—the functionality of a platform without the UX or the polish. Over 1,200 source files, 250+ edge functions, 500+ database migrations. Each feature works, but they don't yet work together. What follows is a breakdown of each experiment, treated as its own standalone app. This is the raw material from which CaptainApp will be forged."
  },
  {
    id: "app-agenttown",
    title: "App: Agent Town",
    subtitle: "An isometric simulation of AI agents",
    content: "Agent Town is perhaps the most visually striking experiment. It's a fully interactive isometric world where AI agents—CEO, CFO, COO, PM, SRE, and others—move between locations, satisfy needs (coffee, cigarettes, focus time), and process real tasks from Linear and GitHub. You can pause time, fast-forward, click on agents to see their current plan, and even build structures with a SimCity-style editor. The simulation runs on a Supabase cron, with each tick updating agent positions and triggering task processing. It's a fascinating visualisation of multi-agent orchestration, but it's more toy than tool. The question remains: does anyone need to watch their AI agents walk to a coffee machine?"
  },
  {
    id: "app-whatsapp",
    title: "App: WhatsApp Integration",
    subtitle: "Bidirectional messaging via Twilio",
    content: "The WhatsApp integration is production-ready infrastructure. Incoming messages hit a Twilio webhook, get stored in Supabase, and can trigger AI-drafted replies. Outgoing messages flow through send-whatsapp-message with template compliance. There's a full conversation UI with contact management, message history, and call monitoring. The voice integration uses OpenAI's realtime API for live transcription. What's missing is the business logic layer—the 'why' of sending messages. The pipes work; we just haven't decided what to pump through them."
  },
  {
    id: "app-graphable",
    title: "App: Graphable Notebooks",
    subtitle: "A computational notebook for business data",
    content: "Graphable is an ambitious Jupyter-style notebook for non-technical users. Cells can execute SQL against connected databases, run Python in sandboxes, call MCP servers, or chat with AI. Results flow between cells via named outputs. There's a playbook system for saving and replaying workflows, connection management for external databases, and webhook triggers for automation. The graph visualisation renders data relationships. It's genuinely powerful—you can pipe Xero invoice data through a Python aggregation into a Neo4j graph—but the UX is rough. Cell execution is slow, error handling is cryptic, and the learning curve is steep."
  },
  {
    id: "app-xero",
    title: "App: Xero Financial Intelligence",
    subtitle: "Deep accounting integration",
    content: "The Xero integration goes far beyond OAuth. Dedicated edge functions sync invoices, contacts, accounts, bank transactions, products, and reports. There's monthly expense aggregation, directors' loan tracking, VAT/tax calculation, and cash flow analysis. The admin UI shows aging receivables, P&L breakdowns, and invoice line items. Automated syncs run on crons. This is probably the most 'product-ready' experiment—it genuinely answers the question 'Who owes us money?'—but it lives in an admin panel that no customer would navigate to."
  },
  {
    id: "app-rippling",
    title: "App: Rippling HR Sync",
    subtitle: "Employee data, time tracking, and payroll",
    content: "The Rippling integration is comprehensive: employees, departments, locations, compensation, leave requests, time cards, shift inputs, and payroll. There's session linking that matches employee work sessions to Supabase presence data—an attempt to answer 'Who was working on what, when?' The time tracking Gantt chart visualises employee hours. The recruiting sync pulls candidate pipelines. It's impressive engineering, but it solves an internal problem (correlating contractor hours with activity) rather than a customer problem."
  },
  {
    id: "app-github",
    title: "App: GitHub Intelligence",
    subtitle: "Commits, PRs, workflows, and line counts",
    content: "GitHub sync captures commits, pull requests, workflow runs, and repository statistics. There's a backfill system for historical data, rate limiting to stay within API quotas, and daily line count refresh. The admin UI shows commit timelines, author activity, and repository health. PR webhooks trigger notifications. Workflow failures can be printed to a physical thermal printer (yes, really). This powers the 'what did we ship?' question, but it's developer-facing, not customer-facing."
  },
  {
    id: "app-agents",
    title: "App: Specialised AI Agents",
    subtitle: "Ten personas with distinct system prompts",
    content: "Beyond Agent Town's simulation, there are standalone agent chat interfaces: CEO Agent (strategic decisions, WhatsApp escalation), CFO Agent (financial queries), COO Agent (operations and notifications), SRE Agent (infrastructure monitoring), PM Agent (project management), DevOps Agent, HR Agent, Legal Agent, Sales Agent, and Business Development Agent. Each has a dedicated edge function, custom system prompt, and conversation history. They're functional—you can chat with the CFO about cash flow—but there's no unified entry point. It's ten chatbots, not one intelligent assistant."
  },
  {
    id: "app-neo4j",
    title: "App: Neo4j Graph Database",
    subtitle: "Relationship mapping for business entities",
    content: "Neo4j integration transforms relational data into a graph of connections. The ingest-to-neo4j function pushes entities; execute-graph-read queries them. The transform-to-graph function generates Cypher from natural language. The admin UI manages Neo4j Aura instances with pause/resume for cost control. It's a fascinating capability—visualising 'who knows whom' or 'which projects touch which integrations'—but it's infrastructure looking for a use case."
  },
  {
    id: "app-linear",
    title: "App: Linear Project Sync",
    subtitle: "Issues, cycles, and velocity tracking",
    content: "Linear sync pulls teams, projects, issues, and cycles. Requirements from CaptainApp can be pushed to Linear as issues. Cycle time analytics measure team velocity. Sprint summaries aggregate progress. The integration works, but it duplicates functionality that Linear already provides. The value would be in cross-referencing Linear data with financial or HR data—which the Graphable notebook can do, but nobody has built that playbook yet."
  },
  {
    id: "app-admin",
    title: "App: The Admin Sprawl",
    subtitle: "Seventy pages of internal tooling",
    content: "The admin section has metastasised into 70+ pages: user management, organisation hierarchy, project settings, integration configuration, sync job monitoring, session analytics, traffic dashboards, COO notifications, SRE monitoring, search, SEO stats, Facebook/Instagram analytics, SendGrid domain management, Anthropic usage tracking, Cursor agent spawning, and more. Each page works. Together they form an impenetrable maze. This is the accumulated archaeology of two years of building—useful for the developer, bewildering for anyone else."
  },
  {
    id: "app-realtime",
    title: "App: Realtime Presence & Collaboration",
    subtitle: "Who's online, co-browsing, and activity feeds",
    content: "Supabase Realtime powers presence tracking: who's online, what page they're viewing, cursor positions for co-browsing. The activity feed logs every significant action with timestamps. Session matching links presence to employee records. Notifications push via web push and Supabase channels. The 100+ custom hooks manage this state. It's impressive plumbing—you can watch someone navigate in real-time—but 'watching colleagues' isn't a product."
  },
  {
    id: "appendix-2",
    title: "Appendix 2: NOMOS",
    subtitle: "A Decision Trace Framework for AI-Native Applications",
    content: "NOMOS is more than a data layer. It is a technical realisation of what the industry has started calling 'Decision Traces'—a paradigm where systems don't just store what happened, but why it happened, who authorised it, and how to undo it. Where traditional databases ask 'What is the current state?', NOMOS asks 'How did we arrive here?' This distinction transforms auditability from a compliance checkbox into a core product feature."
  },
  {
    id: "nomos-philosophy",
    title: "The Philosophy of Decision Traces",
    subtitle: "Storing intent, not just outcome",
    content: "Consider the difference between a traditional database update and a NOMOS intent. A database says: 'Asset X is now in Room Y.' NOMOS says: 'Sarah moved Asset X from Room Z to Room Y at 14:32 on Tuesday, as part of the quarterly inventory rebalancing, approved by the facilities manager.' The first is a fact. The second is a story. And stories are what humans—and AI agents—can reason about. The core insight is simple but profound: the most valuable thing you can store isn't the current state. It's how you got there. Every intent in NOMOS captures the 'why' alongside the 'what', creating an immutable record that can be audited, replayed, and even rewound."
  },
  {
    id: "nomos-ledger",
    title: "The Immutable Ledger",
    subtitle: "Write-only, append-only truth",
    content: "At the heart of NOMOS is the Intent Ledger—a write-only, append-only log that serves as the single source of truth. Nothing is ever deleted or mutated. Instead, corrections are made by appending new intents that 'strike out' previous ones, preserving the complete history of decisions. Every IntentLedgerEntry captures rich context: NomosActorId (who initiated it), NomosWorkspaceId (the tenant boundary), NomosTimelineId (enabling branching for what-if scenarios), NomosCorrelationId and NomosCausationId (for distributed tracing), plus the full chain of DirectiveOutcomes and Events. Sequence numbers track ordering: workspaceIntentSequence for intents, startWorkspaceEventSequence and endWorkspaceEventSequence for events. This structure enables something remarkable: you can replay the entire history of a system, skip struck-out intents, and arrive at any point in time with perfect fidelity."
  },
  {
    id: "nomos-rollback",
    title: "Intents as the Unit of Rollback",
    subtitle: "Transactional boundaries for distributed systems",
    content: "In NOMOS, an Intent is the atomic unit of change—the transactional boundary. A single intent can orchestrate mutations across multiple aggregates and bounded contexts, yet it either succeeds completely or fails atomically. This is achieved through the strikeOutIntentIds mechanism: rather than deleting data, an UndoIntent simply records that a previous intent should be ignored when computing current state. The system includes built-in GenesisIntent (bootstrapping timelines), UndoIntent (striking out previous actions), and RedoIntent (striking out undos). Redo becomes trivial—you strike out the undo. Audit trails remain pristine: every action, including corrections, is permanently recorded. NomosApp exposes undoLatest() and redoLatest() APIs, plus canUndoLatest() and canRedoLatest() for UI state. This makes NOMOS ideal for regulated industries, multi-party collaboration, and any system where 'who did what when' matters."
  },
  {
    id: "nomos-persistence",
    title: "Agnostic Persistence",
    subtitle: "Pluggable truth across any infrastructure",
    content: "NOMOS enforces a strict separation between domain logic and storage. The NomosPersistence abstract class defines seven interfaces: SnapshotReader and SnapshotWriter for aggregate state, LedgerReader and LedgerWriter for intent storage, optional SnapshotWatcher and LedgerWatcher for real-time streams, SpatialQueryService for geo queries, BlobStorage for large payloads, and OptimisticIntentBuffer for UI responsiveness. Three implementations exist: MemoryPersistence (in-memory, perfect for tests), FirestorePersistence (multi-tenant production with GeoFlutterFire integration), and ArangoDB (graph-oriented HTTP polling). Swapping backends is a single constructor change. The Firestore implementation stores intents at workspaces/{workspaceId}/timelines/{timelineId}/intents/{sequence} with snapshots at aggregates/{aggregateId}/snapshots/{sequence}. This decoupling future-proofs applications against infrastructure changes and enables true write-once, run-anywhere domain models."
  },
  {
    id: "nomos-contexts",
    title: "Scaling with Bounded Contexts",
    subtitle: "Maintainable, testable distributed systems",
    content: "Real-world applications rarely fit into a single domain model. NOMOS embraces this complexity through its Directive system, where a single Intent fans out into multiple Directives, each targeting different aggregates across different bounded contexts. The PolicyRouter.route() method receives an Intent, policyVersion, and IntentContext, returning constructed Directives ready for execution. PolicyRouter.validateDirectiveExecution() runs post-mutation checks. TypedPolicyRouter provides generic type safety for specific aggregate/payload combinations. Conflict resolution uses optimistic concurrency: if two clients write to the same timeline, one throws LedgerWriteConflict and must retry (NomosApp.dispatch() retries automatically up to 10 times). For complex merges, NOMOS supports branching timelines via NomosTimelineId—clients fork, experiment, and merge semantically. The policyVersion field enables gradual schema evolution without breaking existing clients."
  },
  {
    id: "nomos-descriptions",
    title: "Human-Readable Intent Descriptions",
    subtitle: "Making the ledger speak English",
    content: "Every Intent implements describe(NomosIntentDescribeCtx ctx) returning a NomosIntentDescription—a template string with variable placeholders. For example: '{actor} created asset {assetName} from listing {listing} at site {site}'. The render() method interpolates variables into the template. Crucially, descriptions are computed on the READ path via NomosIntentDescribeCtx, which provides snapshotLookup to resolve aggregate state. This avoids persisting PII while keeping writes fast. The CO2 domain includes describe_utils.dart with helpers: actorName() resolves user display names from snapshots, siteName() and estateName() resolve location names, resourceName() handles multiple resource types, and attachmentTargetsLabel() formats attachment references. The FallbackDescribeIntent mixin provides a default '{actor} executed {intentType}' for simpler intents."
  },
  {
    id: "nomos-ai-tools",
    title: "Intents as AI Agent Tools",
    subtitle: "A typed toolbelt for autonomous action",
    content: "Here's where NOMOS becomes genuinely AI-native. NomosIntentOpenApiBuilder generates OpenAPI 3.1.0 specifications directly from IntentRegistrySnapshot. The POST /intent endpoint accepts a discriminated union: intentType (enum of registered types), payload (the NomosIntentPayload oneOf schema), and context (workspaceId, timelineId, actorId, correlationId). Each Intent becomes a typed schema like IntentPayload_CreateTrackableAssetIntent with documented properties. The response returns NomosIntentLedgerEntry with success status, sequence numbers, and appliedDirectives. AI agents receive a catalogue of actions—CreateAssetIntent, MoveAssetIntent, AssignResponsibilityIntent—each with clear semantics. Server-only intents are marked with x-nomos-requiresServerRuntime. The agent doesn't need implementation details; the ledger provides complete traceability of every action taken."
  },
  {
    id: "nomos-rag",
    title: "Ledgers for RAG and State Exploration",
    subtitle: "AI that understands how we got here",
    content: "Beyond tool use, NOMOS ledgers are ideal for Retrieval-Augmented Generation (RAG). When an AI needs to answer 'What happened to Asset X?', the aggregateIntentHistory() API returns all IntentLedgerEntries where targetAggregateIds contains that aggregate—each with a human-readable description. For time-travel queries, stateAtSequence(workspaceId, timelineId, inclusiveSequence) reconstructs state at any historical point. readRecentIntentTimeline() fetches the latest N entries in descending order for efficient 'recent activity' queries. countIntentTimeline() provides counts without loading data. AI agents can simulate what-if scenarios: fork a NomosTimelineId, execute test intents via dispatchOptimistic(), evaluate the OptimisticIntentExecutionResult, and discard or merge. The combination of descriptions, rich metadata (correlationId, causationId), and time-travel makes NOMOS uniquely suited for AI reasoning about complex, evolving systems."
  },
  {
    id: "nomos-intent-anatomy",
    title: "Technical Deep Dive: Defining an Intent",
    subtitle: "The anatomy of a decision",
    content: "An Intent extends the Intent base class, requiring: toJson() returning Map with 'id' and 'serialisationTargetClassName', a static fromJson(Map) factory, and describe(NomosIntentDescribeCtx) returning NomosIntentDescription. The constructor calls super() which assigns a UUIDv7 via Uuid().v7(), ensuring globally unique, time-sortable IDs. Key properties: id (the UUID), workspaceIntentSequence (assigned by framework), kind (runtime type), strikeOutIntentIds (list of intents to undo), newPolicyVersion (for migrations), and requiresServerExecution (for server-only operations). IntentBase.fromRegistry() handles deserialisation via IntentFactoryRegistry lookup. The TypeRegistry maps string type names to Dart Types for cross-platform serialisation. Intents carry the 'what' without the 'how'—Directives handle execution."
  },
  {
    id: "nomos-directives",
    title: "Technical Deep Dive: Directives",
    subtitle: "The mutation layer",
    content: "Directive<TAgg, TPayload> is generic over an Aggregate and Payload type. The constructor assigns a UUIDv7 via NomosDirectiveId. Two-phase execution: plan(DirectiveCtx, IntentBase, SnapshotReader, stagedUpdates) is impure—reading snapshots, checking permissions, returning List<ExecutionTarget>; execute(TAgg snapshot, TPayload payload) is pure—returning List<Event> deterministically. DirectiveCtx provides workspaceId, timelineId, intentSeq, actorId, correlationId, causationId, timestamp, plus query<T>() for projections and callIntent() for nested intents. The contextVersion property enables optimistic concurrency checks. Implementing ArchivesAtIntent with archiveAggregateIds marks aggregates for soft-deletion—SnapshotWriter.archiveAtIntent() writes a tombstone. The separation ensures plan() handles distributed reality while execute() remains perfectly reproducible for replay."
  },
  {
    id: "nomos-events-aggregates",
    title: "Technical Deep Dive: Events and Aggregates",
    subtitle: "State as a fold over history",
    content: "Event is an immutable class with payload, optional globalSequenceNumber, copyWith() for sequence assignment, and toJson()/fromJson() serialisation. EventFactoryRegistry enables type-safe deserialisation. Aggregate<TSelf> is self-referential generic: apply(Event) returns TSelf (a fresh instance, never mutation). Constructor assigns UUIDv7 via AggregateId; Aggregate.fromId() preserves IDs during deserialisation. Key properties: id, contextVersion (for optimistic concurrency), workspaceIntentSequence, timelineId. The validate() method enforces invariants—failures abort the entire intent atomically. setFrameworkContext() stamps workspace, timeline, and version automatically. AggregateFactoryRegistry.createEmpty() instantiates aggregates for replay. The pattern is purely functional: state = fold(events), enabling perfect reproducibility and time-travel."
  },
  {
    id: "nomos-execution-pipeline",
    title: "Technical Deep Dive: The Execution Pipeline",
    subtitle: "From intent to persisted truth",
    content: "IntentExecutor orchestrates execution with PolicyRouter, SnapshotReader, SnapshotWriter, LedgerWriter, and optional BlobStorage. The execute(IntentBase) method: calculates nextSeq = previousIntent.workspaceIntentSequence + 1; routes via router.route() to get Directives; for each Directive calls performPlan() then performExecute(); assigns event sequence numbers; validates via router.validateDirectiveExecution(); constructs IntentLedgerEntry with appliedDirectives as DirectiveOutcome list; persists via ledger.writeIntent() (throws LedgerWriteConflict if sequence exists); then saves snapshots via snapshotWriter.saveAtIntent(). Optional blob offload: strings exceeding blobOffloadThresholdBytes are uploaded to BlobStorage with SHA256 content hash, replaced by BlobRef in the entry. executeOptimistically() returns OptimisticIntentExecutionResult for UI preview without persisting."
  },
  {
    id: "nomos-nomosapp",
    title: "Technical Deep Dive: The NomosApp Orchestrator",
    subtitle: "Wiring it all together",
    content: "NomosApp factory accepts NomosPersistence, PolicyModule (with router), plus optional ContractsModule, DomainModule, IntentsModule for type registration, NomosOptions for configuration, and BlobStorage. Core API: dispatch(Intent, ctx?) executes with auto-retry up to 10 times on LedgerWriteConflict; dispatchOptimistic() returns OptimisticIntentExecutionResult for UI preview; state(workspaceId, timelineId) reconstructs current aggregates; stateAtSequence() enables time-travel; watchQuery<T>() streams live aggregate lists with optimistic overlay merging; watch<T>() streams single aggregates; readLatest<T>(), read<T>(), readAtOrBefore<T>() provide typed snapshot access. undoLatest() and redoLatest() manage reversibility with automatic snapshot recomputation. setDefaultIntentContext() simplifies repeated dispatches. OptimisticIntentBuffer handles UI responsiveness during async persistence."
  },
  {
    id: "nomos-codegen-geo",
    title: "Technical Deep Dive: Code Generation and Geo",
    subtitle: "Reducing boilerplate, adding spatial intelligence",
    content: "nomos_codegen provides build_runner generators and NomosIntentOpenApiBuilder. buildDocument(IntentRegistrySnapshot) produces OpenAPI 3.1.0 with /intent POST endpoint, NomosIntentContext schema (workspaceId, timelineId, actorId, correlationId, causationId), NomosIntentPayload discriminated union with 'type' property, NomosDirectiveOutcome, and NomosIntentLedgerEntry response schema. Security schemes include bearerAuth (Firebase/IAM JWT) and ApiKeyAuth. nomos_geo provides pure-Dart GeoJSON: GeoJSONPoint, GeoJSONPolygon, GeoJSONLineString, GeoJSONMultiPoint, GeoJSONMultiPolygon, GeoJSONMultiLineString, GeoJSONGeometryCollection, Feature, and FeatureCollection. SpatialQueryService.subscribeWithin() enables radius queries; FirestoreSpatialQueryService uses GeoFlutterFire for efficient geohash-based indexing. Together: typed API generation for AI tools, spatial intelligence for location-aware applications."
  },
  {
    id: "appendix-3",
    title: "Appendix 3: CO2 Domain",
    subtitle: "A complex application built with NOMOS",
    content: "Appendix 2 described NOMOS in the abstract. Now let's see what it looks like when you actually build something with it. The CO2 Asset Management Platform is a client project: a Flutter application for managing physical assets across commercial property portfolios—think HVAC units, lighting fixtures, fire extinguishers, and solar panels spread across multiple buildings and sites. It's not a toy example. It's 500+ Dart files across 13 bounded contexts with 146 registered intents. And it's still under active development, which means we can be honest about what works and what doesn't."
  },
  {
    id: "co2-structure",
    title: "The Package Structure",
    subtitle: "How bounded contexts become packages",
    content: "The CO2 codebase is organised as a Melos monorepo under dart_packages/co2/. Each bounded context is its own Dart package with its own pubspec.yaml: contracts_v1 (shared value objects and payloads), identity_v1 (users, organisations, invitations), estate_structures_v1 (estates, sites, buildings, rooms, topology), trackable_asset_v1 (the assets themselves), catalogues_v1 (listings, suppliers, taxonomies), attachments_v1 (file storage), permissions_v1 (access control), proposals_v1 (change management), responsibilities_v1 (accountability), insights_v1 (analytics), feedback_v1 (user feedback), licensing_v1 (licence management), and funding_programs_v1 (grant applications). The intents_v1 package holds all the intents—146 files of user-facing commands. The policy_v1 package contains the single PolicyRouter that orchestrates everything. This structure enforces DDD boundaries at the package level: domains can only depend on contracts_v1 and nomos_core, never on each other directly."
  },
  {
    id: "co2-contracts",
    title: "Shared Language: contracts_v1",
    subtitle: "The vocabulary that crosses boundaries",
    content: "The contracts_v1 package is the published language—the shared vocabulary that all bounded contexts agree on. It exports value objects: UserId, EstateId, SiteId, TrackableAssetId, ListingId, and dozens more. These aren't strings; they're typed wrappers with validation. PostalAddress validates country codes. Money stores amounts as integer minor units to avoid floating-point errors. CurrencyCode validates ISO 4217 codes. The package also exports cross-domain payloads: LocationPayload for passing site/floor/room coordinates, FileAttachmentPayload for file metadata, TrackableAssetReplacementSet for bulk operations. When estate_structures_v1 needs to reference a user, it uses UserId from contracts. When identity_v1 needs to mention a site, it uses SiteId. The contracts package grows organically as domains discover they need to communicate—which is both its strength and its weakness."
  },
  {
    id: "co2-estate",
    title: "Bounded Context: Estate Structures",
    subtitle: "The spatial hierarchy",
    content: "estate_structures_v1 models the physical world: an Estate (a company's entire property portfolio) contains Sites (individual buildings or facilities), which contain Buildings, which contain Rooms. But it goes deeper. SiteTopologyAggregate manages spatial geometry: site boundaries as GeoJSON polygons, building footprints, floor plans calibrated to real-world coordinates. MapTile value objects represent floor plan images with rotation, scale, and position transforms. The TopologyIndex provides spatial queries: 'Which rooms contain this point?', 'What's at building Main, level 2?' There's a full draft/publish workflow—topology changes are staged, validated for geometric correctness (no self-intersecting polygons, buildings inside boundaries), then published atomically. It's genuinely sophisticated spatial modelling. It's also where the codebase shows its archaeology: there are legacy GeoJSON storage formats, deprecated feature types, and a 500-line glossary entry trying to explain the difference between unplacedBuildingMapTile and unplacedSiteMapTile."
  },
  {
    id: "co2-identity",
    title: "Bounded Context: Identity",
    subtitle: "Users, organisations, and the invitation dance",
    content: "identity_v1 manages who can do what. UserAggregate stores profile data (name, email, profile picture). OrganizationAggregate groups users into companies. SiteUserAggregate tracks a user's relationship to a specific site, including role (viewer, editor, admin) and granular permissions for layers and features. The invitation flow is a good example of intent-driven design: InviteUserToEstateIntent creates an invitation and notification; AcceptEstateInvitationIntent flips the status and grants permissions; DeclineEstateInvitationIntent records the refusal. Each step is auditable. NotificationInboxAggregate consolidates all a user's notifications into a single document—a conscious denormalisation for efficient mobile syncing. PublicUserEmailIndexAggregate enables fast email lookups without scanning all users. These are the kind of pragmatic trade-offs you make when building real systems."
  },
  {
    id: "co2-catalogues",
    title: "Bounded Context: Catalogues",
    subtitle: "Templates for assets",
    content: "catalogues_v1 solves a common problem: you don't want to manually enter specs for every LED panel when you're installing 500 of the same model. A Catalogue is a collection of Listings—template definitions with specs, pricing, and supplier information. TaxonomyAggregate provides hierarchical categorisation: HVAC > Air Conditioning > Split System, each level with its own custom field definitions (capacity, refrigerant type, noise level). ListingAggregate stores the template with a status lifecycle (draft → submitted → approved → archived) and version publishing for draft editing of live listings. SupplierAggregate tracks manufacturers and vendors. CreateAssetFromListingIntent clones a listing into a TrackableAsset with all specs pre-populated. It's a clean domain—catalogue management is well-understood—but the complexity leaks through in 20+ events and 15+ directives for managing taxonomy custom fields."
  },
  {
    id: "co2-trackable",
    title: "Bounded Context: Trackable Assets",
    subtitle: "The things we're actually tracking",
    content: "trackable_asset_v1 is the core domain: assets with location, status, and lifecycle. TrackableAssetAggregate stores the asset with name, type, custom fields (a map of typed values), and structural assignment (which site, building, level, and room it's in). StructuralAssignment includes topologySequence for tracking whether the assignment is stale after topology changes. AssetComment supports notes and voice transcriptions. The asset position uses GeoJSON coordinates and gets stored as an 'asset_ref' feature in the estate topology. MoveTrackableAssetsIntent handles bulk moves, updating coordinates for multiple assets atomically. The describe() method generates human-readable descriptions by looking up asset names from snapshots: '{actor} moved {assetName} from {fromLat},{fromLng} to {toLat},{toLng}'. This domain demonstrates NOMOS well: every asset movement is an auditable intent."
  },
  {
    id: "co2-intents-examples",
    title: "What Makes Something an Intent?",
    subtitle: "Learning from 146 examples",
    content: "The intents_v1 package has 146 intent classes organised by domain. What makes something an intent rather than a direct API call? Intents represent user-facing commands: CreateTrackableAssetIntent, MoveTrackableAssetsIntent, AcceptEstateInvitationIntent, CreateAssetFromListingIntent. They're the 'what I want to do', not the 'how to do it'. AcceptEstateInvitationIntent carries invitationId, estateId, inviteeUserId, role—everything needed to express the action. The policy router converts this into multiple directives: update the invitation status, grant permissions, maybe create a notification. CreateAssetFromListingWithPositionIntent is a composite: it creates an asset AND positions it on a floor plan in one atomic action. Intents avoid implementation details: they don't mention which tables to update or which services to call. They're pure domain language. The describe() method makes each one human-readable: '{actor} created asset {assetName} from listing {listing} for site {site}'."
  },
  {
    id: "co2-policy",
    title: "The Policy Router",
    subtitle: "Orchestrating cross-context workflows",
    content: "policy_v1 is the orchestration layer—the single file that knows about all bounded contexts and routes intents to directives. Co2PolicyRouter implements PolicyRouter.route(), receiving an intent and returning directives that span contexts. When AcceptEstateInvitationIntent arrives, the router might return: UpdateInvitationStatusDirective (identity context), GrantEstatePermissionDirective (permissions context), and CreateNotificationDirective (identity context, different aggregate). This is where cross-cutting concerns live. The router enforces business rules: 'Only admins can grant admin permissions', 'Assets can only be placed in published topology'. It validates post-execution: router.validateDirectiveExecution() checks invariants after mutations. The policy layer is where the bounded contexts talk to each other—not through direct dependencies, but through orchestrated intent handling."
  },
  {
    id: "co2-tests",
    title: "The Narrative Test Suite",
    subtitle: "Bill's journey through the platform",
    content: "The policy tests are unusual: they read like a story. 'Chapter 1: Bill Gets Started'—Bill from accounting creates a user account, maps his office floor, tracks his first assets. 'Chapter 2: Bill invites Wes'—Wes joins the team, explores the platform. 'Chapter 3: Patty discovers proposals'—the CFO evaluates solar panel ROI. Each test file walks through real user journeys, asserting on Nomos state: 'const user = state[AggregateId('bill-accounting')] as UserAggregate; expect(user.userId.value, equals('bill-accounting'))'. The super_story_test.md describes the arc: 847 retail stores, 12 manufacturing plants, predictive analytics preventing $2.3M in equipment failures. The tests demonstrate emergent behaviour: Bill's simple asset tracking scales to enterprise-wide facilities management. It's BDD taken seriously—specs as executable documentation. It's also fragile: breaking changes ripple through 67+ test files."
  },
  {
    id: "co2-glossary",
    title: "The 1,300-Line Glossary",
    subtitle: "Ubiquitous language, exhaustively documented",
    content: "The GLOSSARY.md file is 1,300+ lines of domain definitions. Every value object, every aggregate, every concept has a definition, usage example, and sometimes migration notes. 'Money: An immutable value object representing a monetary amount with its associated currency, stored internally as integer minor units to avoid floating-point precision issues.' 'Virtual Footprint: A dynamically calculated geographic bounds centered at (0,0) that represents the coordinate space for an unplaced map tile.' There are deprecation warnings ('Deprecated: FloorPlanPosition - replaced by LocalXYPosition'), status markers ('Draft v1 built from exports and known consumers'), and cross-references to code. The glossary grows with the codebase—every PR that adds concepts must update it. It's an impressive artefact of disciplined domain modelling. It's also overwhelming: finding what you need requires knowing what to search for."
  },
  {
    id: "co2-warts",
    title: "Where CO2 Could Be Better",
    subtitle: "An honest assessment",
    content: "CO2 demonstrates NOMOS, but it's not a showcase of perfection. The VO_REPLACEMENT_OPPORTUNITIES.md file lists 21 domains where strings should be value objects but aren't yet—email addresses, website URLs, phone numbers. Some intents are too granular (separate intents for adding vs updating taxonomy custom fields) while others are too coarse (UpdateListingAggregateIntent accepts 15 optional parameters). The 40+ topology intents reflect organic growth rather than careful design. Test coverage is narrative-heavy but assertion-light in places. The contracts_v1 package has grown to 126 exports—it risks becoming a 'shared kernel' anti-pattern. Some domains (licensing, funding) have minimal implementation. The integration with the Flutter UI isn't shown here—there's a separate complexity in binding aggregates to widgets. These are real-world trade-offs: the team shipped features rather than refactoring foundations."
  },
  {
    id: "co2-lessons",
    title: "Lessons from CO2",
    subtitle: "What the codebase teaches about NOMOS",
    content: "Building CO2 taught us what NOMOS is good at and where it struggles. Intent-driven architecture works: 146 intents with human-readable descriptions create genuine auditability. Bounded contexts as packages enforce clean dependencies. The policy router centralises orchestration without creating a monolith. Narrative tests express real requirements. The glossary maintains shared understanding. But: value object discipline is hard to maintain under deadline pressure. Growing a shared contracts package requires governance. Complex spatial modelling creates accidental complexity. The draft/publish workflow adds cognitive load. Event sourcing makes some queries expensive. NOMOS is a powerful foundation, but it doesn't prevent you from making a mess. CO2 is an honest demonstration: sophisticated architecture, real client value, and visible rough edges. That's what production software looks like."
  },
  {
    id: "appendix-future",
    title: "Additional Context And... Thoughts about the future?",
    subtitle: "Just some opinions about where this is all going.",
    content: "Agent harnesses like Claude Code, when combined with a Unix-based operating system that has an enormous user base—such as Ubuntu or macOS—seem to be the environment in which these agents are now most performant. It is becoming the environment in which the foundation models are actually left to explore and become even more performant. The trouble is, not every user has one of those. And even if they do, there's a setup cost. There's also the risk of granting a foundation model access to your whole file system. So the goal should be to provide the user with a persistent, always-on Cloud-based Box that is as close as possible to the environment in which the foundation models are trained to have the most capability."
  },
  {
    id: "future-infra",
    title: "The VM Problem: AWS EC2 and its Pitfalls",
    content: "One possible solution is just spinning up an AWS EC2 container, giving every user a Ubuntu instance. However, there are two key problems with this. Firstly, the security risk: managing hundreds of VMs (one per client) and keeping them isolated from each other and the rest of our cloud, while enabling them access to the wider web, is doable but complicated. The second and more prohibitive issue is cost. Persuading users to pay a subscription is one thing, but an always-on container that they don't use most of the time just eats into margins. If it did make sense, I suspect others would already be doing it—and I notice they're not. [Audio Description: A diagram showing a one-to-one mapping of users to heavy EC2 virtual machines, illustrating the management overhead and the high idle costs that eat into margins.]"
  },
  {
    id: "future-cloudflare",
    title: "The Cloudflare Edge: Serverless Distributed Computing",
    content: "This brings me on to the work that Cloudflare are doing. Some employees there, given permission to work on pet projects during working hours, are combining D1, Durable Objects, Workers, and sandbox primitives to effectively build a file system on top of SQLite. For all intents and purposes, this gives harnesses such as OpenCode—a fast, up-and-coming open-source competitor to Claude Code—a Linux machine with a terminal and file system. It's much like the environments used in reinforcement learning with verifiable training. It's serverless, distributed, scales to zero, easy to secure, and runs on the edge. This is not something we need to build; it's something being built. All we have to do is provide the cleanest user experience to set it up and take responsibility for hosting and isolating client data."
  },
  {
    id: "future-why",
    title: "Why aren't Cloudflare doing this?",
    content: "The first question one might ask is: well, why aren't Cloudflare doing this? The answer is because it's small fish to them. They already run iCloud, two-thirds of the world's DNS, and over a dozen other absolutely enormous platforms. They are not interested in having their own consumer platform. Fundamentally, they provide the cloud primitives for Fortune 500 companies to suit their edge network needs. We provide the bridge to the user. [Audio Description: A diagram showing multiple users sharing a pool of serverless Cloudflare Workers, each with its own isolated SQLite-backed file system, illustrating how compute scales to zero and isolates data at the edge.]"
  }
];

