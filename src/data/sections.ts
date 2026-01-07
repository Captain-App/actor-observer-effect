export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
}

export const sections: Section[] = [
  {
    id: "intro",
    title: "The Bias That Shaped History",
    subtitle: "Why we explain ourselves one way—and everyone else another.",
    content: "In 1971, two psychologists published a paper that would quietly reshape how we understand human conflict. Not wars or revolutions—something more intimate. The daily friction between colleagues, the resentment between partners, the unbridgeable gap between 'I had no choice' and 'You always do this.' Edward Jones and Richard Nisbett called it the actor–observer asymmetry. The idea is deceptively simple: when explaining our own behaviour, we point to circumstances. When explaining someone else's, we point to their character. You're late because you're unreliable. I'm late because the train was delayed."
  },
  {
    id: "watergate",
    title: "1972: A Year of Blame",
    subtitle: "When the theory met reality.",
    content: "The timing was uncanny. Jones and Nisbett's paper circulated widely in 1972—the same year five men broke into the Watergate complex, and a nation began asking: who's responsible? The Supreme Court was busy too. Furman v. Georgia questioned whether capital punishment was applied arbitrarily—who decides which criminals 'deserve' death? Papachristou v. Jacksonville struck down vagrancy laws that let police arrest people for simply existing while poor. The courts were grappling with the same question the psychologists had framed: when we judge someone's actions, are we seeing the person—or the situation they were trapped in?"
  },
  {
    id: "mechanism",
    title: "The Perceptual Trap",
    subtitle: "Why your brain lies to you about other people.",
    content: "Jones and Nisbett proposed two mechanisms. First: information asymmetry. You know your own history—the bad night's sleep, the argument that morning, the years of context behind your decision. When you watch someone else, you see only the action. Second: perceptual salience. When you act, your attention faces outward—toward the situation you're navigating. When you observe, the other person is the salient 'figure' against the background of their environment. They become the cause. The situation fades into scenery. This isn't stupidity. It's how perception works. And it has consequences."
  },
  {
    id: "courtroom",
    title: "The Courtroom Problem",
    subtitle: "Judges are observers. Defendants are actors.",
    content: "Consider a confession. The defendant says: 'I was exhausted. They questioned me for fourteen hours. I would have said anything to make it stop.' The judge sees: a person who confessed. The asymmetry is structural. Judges and juries are, by definition, observers. They watch from outside. They see the defendant as the salient figure. The interrogation room, the sleep deprivation, the implied threats—these are background. Context. Excuses. Legal psychology has documented this extensively. Observers systematically underestimate how constrained people feel in custodial settings. The defendant experienced coercion. The jury sees a choice."
  },
  {
    id: "management",
    title: "The Performance Review",
    subtitle: "Your boss thinks you're the problem. You think you're surrounded by problems.",
    content: "Organisational psychology picked up the actor–observer effect and found it everywhere. Managers attribute poor performance to the employee: they lack motivation, they're not detail-oriented, they don't care. Employees attribute the same performance to circumstances: unclear requirements, impossible deadlines, broken tools, absent support. Both are telling the truth as they see it. The manager watches the employee. The employee navigates the situation. Neither is lying. Both are trapped in their perceptual position. This is why 360-degree feedback exists—not because more opinions are better, but because the asymmetry is real and you need multiple angles to see past it."
  },
  {
    id: "replication",
    title: "The Uncomfortable Truth",
    subtitle: "What happened when scientists tried to prove it.",
    content: "Here's where it gets interesting. In 2006, Bertram Malle published a meta-analysis of every study testing the actor–observer effect from 1971 to 2004. The result? The average effect size was essentially zero. The classic, clean asymmetry—actors cite situations, observers cite dispositions—didn't reliably replicate. The textbook story was wrong. But the story wasn't entirely wrong. The effect appeared under specific conditions: negative events, blame-laden contexts, certain experimental methods. When something goes wrong, the asymmetry emerges. When things are neutral or positive, it often reverses. The bias isn't universal. It's situational. Which is, if you think about it, rather ironic."
  },
  {
    id: "misuse",
    title: "The Rhetorical Weapon",
    subtitle: "How a psychology concept became a way to win arguments.",
    content: "Once a concept enters popular discourse, it gets weaponised. 'That's just actor–observer bias' became a way to dismiss someone's explanation without examining it. Your colleague says they missed the deadline because three other projects landed simultaneously. You say: 'Classic actor–observer effect—you're just making excuses.' This move is intellectually dishonest. It uses the language of psychology to avoid the work of understanding. The actor–observer effect describes a tendency in perception, not a verdict on truth. Sometimes the situation really was the cause. Sometimes the person really is the problem. The bias tells you to check your assumptions—not which assumption is correct."
  },
  {
    id: "confusion",
    title: "Three Biases, Often Confused",
    subtitle: "The actor–observer effect is not what you think it is.",
    content: "Psychology students—and psychology professors—routinely conflate three distinct phenomena. The fundamental attribution error: observers over-attribute behaviour to personality, even when situational causes are obvious. The actor–observer asymmetry: actors and observers explain the same behaviour differently. The self-serving bias: people attribute their successes to themselves and their failures to circumstances. These overlap but aren't identical. The self-serving bias depends on whether the outcome is good or bad. The fundamental attribution error is about observers specifically. The actor–observer effect is about the difference between perspectives. Malle's meta-analysis found that much of what people thought was actor–observer was actually self-serving bias in disguise."
  },
  {
    id: "modern",
    title: "What Actually Replicates",
    subtitle: "The real science beneath the myth.",
    content: "Modern research has moved beyond the simple person-versus-situation framing. What reliably differs between actors and observers isn't where they locate causality—it's how they structure explanations. Actors explain their own actions using reasons and mental states: 'I did it because I wanted to help.' Observers explain the same actions using background causes and traits: 'She did it because she's helpful.' The asymmetry is linguistic and conceptual, not just attributional. This is subtler than the textbook version. It's also more robust. People don't just disagree about person versus situation—they disagree about what kind of explanation counts as an explanation at all."
  },
  {
    id: "politics",
    title: "The Political Divide",
    subtitle: "Why empathy is so hard across the aisle.",
    content: "Consider how political opponents explain each other's votes. Your side voted for economic relief because people are struggling. Their side voted for tax cuts because they're greedy. Your side opposes immigration because communities are overwhelmed. Their side opposes immigration because they're racist. The actor–observer asymmetry doesn't cause political polarisation—but it amplifies it. Each side has rich, contextual understanding of their own reasoning. Each side sees the other as a collection of character flaws. Social media makes this worse. You see people's actions—their tweets, their votes, their protests—stripped of context. They become pure figures against no background at all."
  },
  {
    id: "therapy",
    title: "The Therapeutic Insight",
    subtitle: "What happens when you become the observer of yourself.",
    content: "Therapists have long noticed something curious. Clients often describe their own behaviour in situational terms—'I had to, given the circumstances'—until they don't. Breakthroughs often involve shifting from actor to observer perspective on oneself. 'I keep doing this. Why do I keep doing this?' The question implies stepping outside, watching yourself as others watch you. This can be destabilising. But it can also be liberating. If you can see your own patterns as an observer would, you can start to question whether the 'situations' you keep finding yourself in are really external—or whether you're creating them."
  },
  {
    id: "storms",
    title: "The Camera Experiment",
    subtitle: "Proof that perspective literally changes perception.",
    content: "In 1973, Michael Storms ran an elegant experiment. Participants had conversations while being filmed from different angles. Later, they watched the footage and explained their own behaviour. The twist: some participants watched footage from their own perspective (camera behind them, facing outward). Others watched footage from the observer's perspective (camera facing them). The result was striking. Participants who watched themselves from the observer's angle made more dispositional attributions about their own behaviour. Seeing yourself as others see you literally changes how you explain yourself. The asymmetry isn't just about knowledge—it's about visual attention. What's salient becomes causal."
  },
  {
    id: "application",
    title: "The Practical Audit",
    subtitle: "How to use this without abusing it.",
    content: "If you want to apply the actor–observer effect honestly, here's a framework. When you're the observer: ask what constraints the actor faced that you can't see. What's their history? What pressures are invisible to you? When you're the actor: ask what patterns an observer might notice that you're blind to. Are you really responding to circumstances—or creating them? In disputes, force a two-column audit. Column A: constraints, incentives, context the actor had. Column B: stable patterns, available alternatives, what they could have done differently. Neither column is the truth. Both columns together are closer to it."
  },
  {
    id: "humility",
    title: "The Epistemological Lesson",
    subtitle: "What psychology teaches us about knowing anything.",
    content: "The actor–observer effect is a case study in how psychology works—and fails. A compelling idea, elegantly framed, enters the literature. It gets taught, cited, applied. Decades later, someone actually checks the evidence and finds the original claim was overstated. But the idea isn't worthless—it's just more complicated than the textbook version. This is how knowledge accumulates. Not by proving things true, but by discovering the boundaries of when they're true. The actor–observer effect is real, sometimes, under certain conditions, for certain kinds of explanations. That's less satisfying than a universal law. It's also more honest."
  },
  {
    id: "conclusion",
    title: "The Question That Remains",
    subtitle: "What would you see if you could watch yourself?",
    content: "Here's the thought experiment that stays with me. Imagine you could watch a documentary of your own life—filmed from the outside, narrated by someone who doesn't know your inner monologue. What patterns would you notice? What explanations would you reach for? Would you be sympathetic to the protagonist, or frustrated by their repeated mistakes? The actor–observer effect suggests that the version of yourself you'd see from outside is genuinely different from the version you experience from inside. Neither is the 'real' you. Both are partial. The gap between them is where most human misunderstanding lives."
  }
];
