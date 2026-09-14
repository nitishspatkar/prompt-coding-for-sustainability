/** Split prompt text into prose and fenced code blocks. */
export function parsePromptText(text) {
  if (!text) return { prose: '', code: null }
  const fence = /```(?:\w+)?\n?([\s\S]*?)```/
  const match = text.match(fence)
  if (!match) return { prose: text.trim(), code: null }
  const prose = text.replace(fence, '').trim()
  return { prose, code: match[1].replace(/\n$/, '') }
}

export const SE_ACTIVITIES = [
  {
    code: 'Requirements',
    short: 'What the system should do',
    desc: 'Stories, specs, acceptance criteria, eliciting or clarifying needs.',
  },
  {
    code: 'Architecture',
    short: 'Major system structure',
    desc: 'Components, responsibilities, system-wide style or scale-out shape.',
  },
  {
    code: 'Design',
    short: 'Detailed / UI design',
    desc: 'Data models, interfaces, UI/usability/user flows/mockups, choosing an approach at component level.',
  },
  {
    code: 'Construction',
    short: 'Build or change code',
    desc: 'Coding, refactor, implement, config-as-build, artefact docs. Default when there is no live/post-delivery cue.',
  },
  {
    code: 'Testing',
    short: 'Tests or observe a failure',
    desc: 'Tests, coverage, how to observe a failure — not find-and-fix.',
  },
  {
    code: 'Operations',
    short: 'Deploy, run, live incident',
    desc: 'Deploy, run, provision, monitor, or a live incident (logs, downtime, rollback).',
  },
  {
    code: 'Maintenance',
    short: 'Evolve delivered software',
    desc: 'Post-delivery / in-use / legacy / adapt-in-the-field — only when that frame is in the prompt.',
  },
  {
    code: 'Other',
    short: 'No system SE task',
    desc: 'Pure concept or general knowledge, or residual (e.g. abstract project management).',
  },
]

export const DIMS = [
  { code: 'ENV', name: 'Environmental', desc: 'Effects on natural resources, energy or emissions caused by building or running the software.', example: 'Scaling clusters to zero overnight reduces energy draw.', short: 'Energy, resources, emissions' },
  { code: 'SOC', name: 'Social', desc: 'Effects on groups, communities, equity of access or shared trust.', example: 'Offline support extends access to users without coverage.', short: 'Communities, equity, access' },
  { code: 'IND', name: 'Individual', desc: "Effects on a single person's wellbeing, autonomy, privacy or cognitive load.", example: 'Fewer night pages protect on-call engineers.', short: 'Wellbeing, privacy, load' },
  { code: 'ECO', name: 'Economic', desc: 'Effects on cost, revenue, viability or the value of invested effort.', example: 'Smaller images cut the CI bill.', short: 'Cost, viability, value' },
  { code: 'TEC', name: 'Technical', desc: 'Effects on the longevity, maintainability and adaptability of the system itself.', example: 'A deprecation plan preserves integrator compatibility.', short: 'Longevity, maintainability' },
]

export const VALS = [
  { code: 'POS', name: 'Positive', desc: 'The prompt seeks or implies an improvement on that dimension.', short: 'Improvement sought' },
  { code: 'NEG', name: 'Negative', desc: 'The prompt seeks or implies a worsening, or accepts one as a trade-off.', short: 'Worsening or trade-off' },
  { code: 'MIX', name: 'Mixed', desc: 'The same effect is both an improvement and a worsening on that dimension.', short: 'Both directions at once' },
  { code: 'CANT_TELL', name: 'Cannot tell', desc: 'A sustainability effect is present but its direction is not determinable from the prompt.', short: 'Direction indeterminable' },
]

export const RULES = [
  { n: '1', text: 'Code the prompt, not the likely response.' },
  { n: '2', text: 'One row per distinct effect. Repeat a dimension if the prompt implies two separate effects on it.' },
  { n: '3', text: 'Use MIX only when a single effect runs in both directions, not when two effects disagree.' },
  { n: '4', text: 'Use CANT_TELL when the direction depends on context the prompt does not give, and add a note.' },
  { n: '5', text: 'When torn between relevant and not relevant, mark relevant and record CANT_TELL.' },
]

export function emptyEffect() {
  return { dimension: '', valence: '', coder_note: '' }
}

export const SESSION_KEY = 'spc_session'
