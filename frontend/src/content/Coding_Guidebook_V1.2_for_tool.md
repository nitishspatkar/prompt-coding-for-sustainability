# Coding Guidebook — quick reference for the tool

**Based on Guidebook v1.2** (14 September 2026)  
Use this while coding. For the full pre-read, see the complete Coding Guidebook v1.2 outside the tool.

You code the **prompt** for sustainability-relevant **intent**: the plausible **effect** if the request were fulfilled as written — not the model’s reply, and not what was built later.

| Not relevant | Relevant |
|---|---|
| “Write a function to reverse a string.” | “Refactor this module to reduce memory use on low-end mobile devices.” |

You are **not** judging later sustainability of the product, answer quality, or LLM energy use.

---

## 1. Procedure (while coding)

Many prompts are a short request plus pasted code or logs. **Code the request** (the question or instruction). Pasted code, logs, and files are **context** — unless the request itself engages them.

Example: “what suggestions do you have to refactor this component?” + a long UI file → code the refactor request; labels inside the paste do not count by themselves.

**Four steps.** Activity is always coded. Steps 3–4 only when relevant.

1. **Activity** (§3). Exactly one tag for the primary SE task.
2. **Relevance** (§4). If *not relevant*, stop.
3. **Dimension(s)** (§5). One or more; code each separately.
4. **Valence** (§6). For *each* dimension: Positive / Negative / Mixed / Can't tell.

**If you are unsure**

| You are unsure about… | Do this |
|---|---|
| Whether anything sustainability-related is in play at all | **Not relevant**. Do not stretch. |
| A dimension is clearly in play, but not the direction | Keep the dimension; valence = **Can't tell** (CANT_TELL). |
| It feels related but fits no dimension | Do not force a code. Leave a note. |

> **Disagreement with another coder is expected.** Apply these rules consistently; you are not hunting a unique “correct” answer.

---

## 2. How to read a prompt

1. **Code the request, not the paste.** Words only inside pasted code (names, comments, UI labels) do not count unless the request engages them.
2. **Find the question or instruction first** — “fix,” “refactor,” “how do I,” “explain,” “write.”
3. **Length is not relevance.** A long dump can be generic; a short line can be a direct sustainability ask.
4. **Do not complete** a truncated or incoherent prompt with what you assume they meant.
5. **The same word can mean different things.** “Waste” / “token” — context decides.

---

## 3. SE activity

**One tag only.** If two seem present, tag the **primary request**.

**Questions and explanations count.** “Explain” / “how does” / “what is” is not its own activity — tag the SE task the help is *about*. Use **Other** only when there is **no identifiable SE task for a system**.

Code activity even when not sustainability-relevant. Do not let activity decide relevance.

| Category | What it covers |
|---|---|
| Requirements | Stories, specs, acceptance criteria, eliciting or clarifying needs. |
| Architecture | Major structure — components, responsibilities, system-wide style or scale-out. |
| Design | Data models, interfaces, **UI / usability / flows / mockups**, choosing an approach at component level. |
| Construction | Coding, refactor, implement, config-as-build, artefact docs. |
| Testing | Tests, coverage, how to observe a failure — not “find and fix.” |
| Operations | Deploy, run, provision, monitor, or a **live** incident. |
| Maintenance | Evolve software **already delivered**, when the prompt shows that frame (legacy, post-release, new OS/API, field defect). |
| Other | No system SE task, or residual (e.g. abstract project management). |

**Construction vs Maintenance vs Operations** — cues **in the prompt text only**. Do not guess production.

- **Operations** — explicit run/deploy/incident language.
- **Maintenance** — explicit post-delivery / in-use / legacy / field language.
- **Otherwise** (including “fix this” + paste with no such cue) → **Construction**.

| Example | Tag |
|---|---|
| “Help me write user stories for a checkout flow that supports guest users.” | Requirements |
| “What's a good way to structure services so they scale independently by region?” | Architecture |
| “Sketch a checkout screen flow so guest users can pay in three taps.” | Design |
| “Fix this null pointer exception in the login handler.” | Construction |
| “Write unit tests for the payment module.” | Testing |
| “When deploying… trips view… error on the logs” (500) | Operations |
| “This has been throwing errors since we upgraded to the new OS — help get it running again.” | Maintenance |
| “What's the difference between REST and GraphQL?” | Other |

| Easy to mis-tag | Tag | Why |
|---|---|---|
| “Where is the bug and how can it be fixed?” (+ paste, no live cue) | Construction | Fix, not a test suite; no Maintenance cue. |
| “what concepts should I look into?” for a multi-party encrypt scheme in C# | Design | Choosing an approach; not Other. |
| “how are express.js middleware functions commonly named?” | Other | No system task. |

---

## 4. Relevance

**Question:** if fulfilled as written, would the request have a **concrete, fairly direct effect** on one of the five dimensions — or is it routine, preference, or too generic?

Long “this could eventually…” chains → usually **not relevant**. Technical / performance / money in passing is not enough. Impacts **outside** the requester’s project also count.

**When in doubt:** if you cannot point to the connection without stretching → **not relevant**.

| Not relevant | Relevant |
|---|---|
| “Write a function to reverse a string.” | “Refactor this module to reduce memory use on low-end mobile devices.” (ENV) |
| “Optimize this SQL query for performance.” — no specific mechanism. | “Rewrite this query to avoid loading the entire table into memory — it's crashing our low-memory servers.” (ENV; maybe TEC) |
| “Design a caching layer for our microservices.” | “Design a caching layer … to reduce our database costs.” (ECO) |
| “what would be the dis advantages of a --no-check-certificate flag on wget” — explanation only. | “what are the remediating steps for … CVE-2023-24830?” — asks how to **fix** (TEC) |
| “This library is really convenient” / “nice if this ran faster” | “Cut polling from 100ms to 5s to reduce battery drain.” (ENV) |
| “Cron that pings our own /health once a minute.” | “Cron that pings a competitor's API once per second, indefinitely.” |

The **same** technical request can be relevant or not depending on whether a concrete impact is stated. Memory or “performance” alone is not ENV — ENV needs **resource use, energy, data volume, or pressure on devices/hardware**. Ordinary speed-tuning without that link stays not relevant (or maybe TEC if long-term reliability is at stake).

---

## 5. Dimensions

Skip dimensions that are not really engaged. A prompt can take more than one. Put the concern in the **coder note**, not in the dimension cell.

### Social (SOC)

Communities, groups, trust, fairness, inclusion, how people interact — not only one person’s private experience.

| Example | Dimension | Coder note |
|---|---|---|
| “Add ARIA labels and screen-reader support to this form.” | SOC | Accessibility |
| “Write a moderation rule that auto-removes posts … no appeal.” | SOC | Fairness/governance |

### Individual (IND)

A **person’s** well-being, health, privacy, safety, or autonomy (including dark patterns / addictive design).

| Example | Dimension | Coder note |
|---|---|---|
| “Push notification every time the user closes the app…” | IND | Autonomy / addictive design |
| “Don't store the user's location after the session ends.” | IND | Privacy |

### Environmental (ENV)

Energy, material resources, waste, hardware lifecycle (battery, data volume, pressure on devices). The word “energy” is not required.

| Example | Dimension | Coder note |
|---|---|---|
| “My phone gets hot when this runs.” | ENV | Heat / energy |
| “Compress these assets … to cut our data transfer costs.” | ENV + ECO | Two dimensions, two rows |

### Economic (ECO)

**Explicit** financial angle — money, cost, price, revenue, subscription. Not general usefulness.

| Example | Dimension | Coder note |
|---|---|---|
| “Licensing costs tripled — find a way to cut them.” | ECO | Cost (organisation) |
| “Add a paywall that blocks previously free export features.” | ECO | Affordability (often NEG) |

### Technical (TEC)

**Long-term** technical health: maintainability, compatibility, security, keep working as things change — including load/risk that undermines *someone else’s* system.

Not every bug fix or feature is TEC. Signal (not required): “before this becomes a problem,” “so we don't rewrite again,” “keeps breaking….” Construction ≠ TEC automatically.

| Example | Dimension | Coder note |
|---|---|---|
| “Add input validation … prevent SQL injection.” | TEC | Security |
| “CI rule requiring accessibility checks on every future PR.” | TEC + SOC | Two rows |
| “Fix the typo in this error message.” | — | Not TEC |

### Boundaries

**ECO vs TEC**

| Example | Dimension |
|---|---|
| “Migrate … to a cheaper hosting tier.” | ECO |
| “Migrate … to a more scalable hosting setup.” | TEC (or nothing), not ECO |

**IND vs SOC** — person vs group/community. Both can apply.

| Example | Dimension |
|---|---|
| “Remove 'last seen online' … pressure to reply.” | IND |
| “Group admin can remove others without consent.” | SOC |

**Two dimensions ≠ Mixed.** Different dimensions get separate rows. Mixed is only **one** dimension with both sides.

---

## 6. Valence

For each engaged dimension: effect direction for **affected stakeholders**, not only the requester.

| Valence | Code | Meaning |
|---|---|---|
| Positive | POS | Supports this dimension for affected stakeholders. |
| Negative | NEG | Undermines this dimension. |
| Mixed | MIX | **One** dimension, both sides at once. |
| Can't tell | CANT_TELL | Dimension applies; direction needs speculation. |

**Can't tell ≠ not relevant.** **Mixed ≠ two dimensions disagree.**

1. If the prompt **states** a direction, use that (“temporary” shortcut still NEG).
2. Else infer only when **direct and common technical knowledge**.
3. Otherwise **CANT_TELL**.

| Example | Dimension | Valence | Coder note |
|---|---|---|---|
| “Make sure this is accessible.” | SOC | POS | Stated. |
| “Hardcode this credential for now; rotate later.” | TEC | NEG | Stated shortcut. |
| Unthrottled hammering of someone else’s API | TEC | NEG | Harm to another system. |
| Generic “clean up this code.” | — | — | Do not infer TEC POS. |
| “Cheap export option, but hide the button…” | ECO / IND | POS / NEG | Two dimensions, not MIX. |
| “Discounted plan by silently opting into auto-renewal…” | ECO | MIX | One dimension, both sides. |
| “Caching layer … to reduce database costs.” | ECO | POS | Stated cost cut. |
| “Scraper that respects robots.txt and backs off on 429s.” | TEC | CANT_TELL | Do not assume misuse. |
| “Scraper that ignores robots.txt and hits as fast as possible.” | TEC | NEG | Stated. |

---

## 7. Worked examples

### Example 1 — multi-actor key backup

> I have a private key… don't want it stored in 1 location… several family members, a lawyer, maybe a web service… PIN always needed… restore needs at least 3 people + PIN… How would you implement this? Give me high level…

- **Activity:** Architecture (high-level multi-actor scheme, not “write this function”).
- **Relevance:** Yes — how a private key is split, stored, restored.
- **TEC / POS** — avoid single location; long-term control of a credential.
- **IND / MIX** — personal key; protection vs more people on the restore path (both sides in IND).
- No SOC / ENV / ECO.

| SE activity | Relevant | Dimension | Valence | Coder note |
|---|---|---|---|---|
| Architecture | Yes | TEC | POS | Avoid single location for a credential. |
| Architecture | Yes | IND | MIX | Protection vs more people on restore path. |

### Example 2 — refactor + pasted UI (privacy in the paste only)

> what suggestions do you have to refactor this component?  
> *(long TSX paste including a “YouTube Privacy Mode” toggle…)*

- **Ignore** almost all of the paste. Privacy/tracking text is **existing UI copy**, not the request.
- **Activity:** Construction (refactor existing code; no Ops/Maintenance cue).
- **Relevance:** **Not relevant** — generic refactor; no stated privacy/maintainability purpose. Do not use CANT_TELL instead of not relevant.

| SE activity | Relevant | Dimension | Valence | Coder note |
|---|---|---|---|---|
| Construction | No | | | Paste mentions privacy mode; request does not engage it. |

If the request had been “keep privacy-mode behaviour but simplify URL handling,” IND (and possibly TEC) would be in play.
