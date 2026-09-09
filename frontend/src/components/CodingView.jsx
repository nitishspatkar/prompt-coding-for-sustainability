import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  confirmPrompt,
  getAllPrompts,
  getNextPrompt,
  getPrompt,
  submitAll,
} from '../api'
import { DIMS, VALS, SE_ACTIVITIES, emptyEffect, parsePromptText } from '../constants'
import GuidelinesPanel from './GuidelinesPanel'
import PromptListModal from './PromptListModal'
import SubmitModal from './SubmitModal'

function effectsFromApi(effects) {
  if (!effects || effects.length === 0) return []
  if (effects.every((e) => !e.is_relevant)) return []
  return effects
    .filter((e) => e.is_relevant)
    .map((e) => ({
      dimension: e.dimension || '',
      valence: e.valence || '',
      coder_note: e.coder_note || '',
    }))
}

function relevanceFromApi(effects, isConfirmed) {
  if (!effects || effects.length === 0) return null
  if (!isConfirmed && effects.every((e) => e.dimension == null && !e.is_relevant)) {
    // shouldn't happen; treat presence of not-relevant row as not relevant if confirmed
  }
  if (effects.some((e) => e.is_relevant)) return 'relevant'
  return 'not_relevant'
}

export default function CodingView({
  participantId,
  isSubmitted,
  panelOpen: panelOpenProp,
  onPanelChange,
  onSubmitted,
}) {
  const [prompt, setPrompt] = useState(null)
  const [list, setList] = useState([])
  const [progress, setProgress] = useState({ total: 0, confirmed: 0, remaining: 0 })
  const [relevance, setRelevance] = useState(null)
  const [seActivity, setSeActivity] = useState('')
  const [effects, setEffects] = useState([])
  const [cheatOpen, setCheatOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(isSubmitted)

  const panelOpen = panelOpenProp

  const loadList = useCallback(async () => {
    const data = await getAllPrompts(participantId)
    setList(data.prompts)
    setProgress(data.progress)
    setLocked(data.is_submitted)
    return data
  }, [participantId])

  const applyPrompt = useCallback((data) => {
    setPrompt(data)
    setProgress(data.progress)
    setSeActivity(data.se_activity || '')
    const rel = data.is_confirmed
      ? relevanceFromApi(data.effects, data.is_confirmed)
      : data.effects?.length
        ? relevanceFromApi(data.effects, data.is_confirmed)
        : null
    setRelevance(rel)
    if (rel === 'relevant') {
      const rows = effectsFromApi(data.effects)
      setEffects(rows.length ? rows : [emptyEffect()])
    } else {
      setEffects([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [next] = await Promise.all([getNextPrompt(participantId), loadList()])
        if (!cancelled) applyPrompt(next)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load prompt')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [participantId, applyPrompt, loadList])

  const { prose, code } = useMemo(
    () => parsePromptText(prompt?.prompt_text || ''),
    [prompt],
  )

  const valid = useMemo(() => {
    if (!seActivity) return false
    if (relevance === 'not_relevant') return true
    if (relevance !== 'relevant') return false
    return effects.length > 0 && effects.every((e) => e.dimension && e.valence)
  }, [seActivity, relevance, effects])

  const validationHint = !seActivity
    ? 'Choose an SE activity to continue.'
    : relevance === null
      ? 'Choose a relevance value to continue.'
      : !valid
        ? 'Every effect row needs a dimension and a valence.'
        : ''

  const sortedList = useMemo(
    () => [...list].sort((a, b) => a.randomized_position - b.randomized_position),
    [list],
  )

  const currentIndex = sortedList.findIndex((p) => p.prompt_id === prompt?.prompt_id)
  const positionLabel =
    currentIndex >= 0
      ? `${currentIndex + 1} of ${progress.total}`
      : `— of ${progress.total}`

  const statusLabel = prompt?.is_confirmed
    ? 'confirmed'
    : relevance
      ? 'in progress'
      : 'not coded'

  const effectTotal = list.reduce(
    (n, p) => n + (p.is_confirmed && p.is_relevant ? p.effect_count : 0),
    0,
  )

  async function goTo(promptId) {
    setLoading(true)
    setError('')
    setListOpen(false)
    try {
      const data = await getPrompt(participantId, promptId)
      applyPrompt(data)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err.message || 'Failed to load prompt')
    } finally {
      setLoading(false)
    }
  }

  function goRelative(delta) {
    if (currentIndex < 0) return
    const next = sortedList[currentIndex + delta]
    if (next) goTo(next.prompt_id)
  }

  function setRelevant() {
    if (locked) return
    setRelevance('relevant')
    setEffects((prev) => (prev.length ? prev : [emptyEffect()]))
  }

  function setNotRelevant() {
    if (locked) return
    setRelevance('not_relevant')
    setEffects([])
  }

  function updateEffect(i, patch) {
    setEffects((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }

  function removeEffect(i) {
    setEffects((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addEffect() {
    setEffects((prev) => [...prev, emptyEffect()])
  }

  async function handleConfirm() {
    if (!valid || !prompt || locked || saving) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        participant_id: participantId,
        prompt_id: prompt.prompt_id,
        se_activity: seActivity,
        is_relevant: relevance === 'relevant',
        effects:
          relevance === 'relevant'
            ? effects.map((e) => ({
                is_relevant: true,
                dimension: e.dimension,
                valence: e.valence,
                coder_note: e.coder_note || null,
              }))
            : [{ is_relevant: false }],
      }
      const saved = await confirmPrompt(payload)
      applyPrompt(saved)
      const refreshed = await loadList()
      const remaining = refreshed.prompts
        .filter((p) => !p.is_confirmed)
        .sort((a, b) => a.randomized_position - b.randomized_position)
      if (remaining.length > 0) {
        const nextUnconfirmed = remaining[0]
        if (nextUnconfirmed.prompt_id !== prompt.prompt_id) {
          await goTo(nextUnconfirmed.prompt_id)
        } else if (currentIndex < sortedList.length - 1) {
          await goTo(sortedList[currentIndex + 1].prompt_id)
        }
      } else if (currentIndex < sortedList.length - 1) {
        await goTo(sortedList[currentIndex + 1].prompt_id)
      }
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const result = await submitAll(participantId)
      setLocked(true)
      setSubmitOpen(false)
      onSubmitted(result)
    } catch (err) {
      setError(err.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmLabel = prompt?.is_confirmed
    ? currentIndex >= progress.total - 1
      ? 'Update coding'
      : 'Update and continue'
    : currentIndex >= progress.total - 1
      ? 'Confirm'
      : 'Confirm and continue'

  const allCoded = progress.total > 0 && progress.remaining === 0
  const progressPct =
    progress.total > 0 ? Math.round((progress.confirmed / progress.total) * 100) : 0

  if (loading && !prompt) {
    return (
      <div className="centered-screen">
        <p style={{ color: 'var(--ink-4)' }}>Loading prompts…</p>
      </div>
    )
  }

  return (
    <div className="coding-layout">
      <header className="coding-header">
        <div className="header-spacer" />
        <div className="progress-meta">
          <span>{progress.confirmed} coded</span>
          <span className="progress-sep">/</span>
          <span>{progress.remaining} remaining</span>
          <span className="progress-sep">/</span>
          <span>{progress.total} total</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-ghost" onClick={() => setListOpen(true)}>
            All prompts
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onPanelChange(!panelOpen)}
          >
            {panelOpen ? 'Hide guidelines' : 'Guidelines'}
          </button>
        </div>
      </header>

      <div className="coding-body">
        <main className="coding-main">
          <div className="coding-inner">
            {locked ? (
              <div className="locked-banner">
                Your codings have been submitted and are now read-only.
              </div>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}

            {prompt ? (
              <>
                <article className="prompt-card">
                  <div className="prompt-card-head">
                    <span className="prompt-id">{prompt.prompt_id}</span>
                    <span className="prompt-meta">
                      {positionLabel} · {statusLabel}
                    </span>
                  </div>
                  <div className="prompt-card-body">
                    <div className="prompt-text">{prose}</div>
                    {code ? (
                      <div className="code-block">
                        <div className="code-block-label">Code included in prompt</div>
                        <pre>{code}</pre>
                      </div>
                    ) : null}
                  </div>
                </article>

                <div className="activity-block">
                  <div className="section-label">SE activity</div>
                  <label className="activity-field">
                    <select
                      value={seActivity}
                      onChange={(e) => setSeActivity(e.target.value)}
                      disabled={locked}
                      aria-label="SE activity"
                    >
                      <option value="">— select —</option>
                      {SE_ACTIVITIES.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} — {a.short}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="relevance-block">
                  <div className="section-label">Sustainability relevance</div>
                  <div className="relevance-toggles">
                    <button
                      type="button"
                      className={`toggle-btn${relevance === 'relevant' ? ' active' : ''}`}
                      onClick={setRelevant}
                      disabled={locked}
                    >
                      Relevant
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn${relevance === 'not_relevant' ? ' active' : ''}`}
                      onClick={setNotRelevant}
                      disabled={locked}
                    >
                      Not Relevant
                    </button>
                  </div>
                </div>

                {relevance === 'relevant' ? (
                  <div className="effects-block">
                    <div className="cheat-sheet">
                      <button
                        type="button"
                        className="cheat-toggle"
                        onClick={() => setCheatOpen((o) => !o)}
                      >
                        <span>Code cheat-sheet — dimensions and valence</span>
                        <span>{cheatOpen ? '–' : '+'}</span>
                      </button>
                      {cheatOpen ? (
                        <div className="cheat-body">
                          <div>
                            <div className="cheat-heading">Dimensions</div>
                            {DIMS.map((d) => (
                              <div className="cheat-row" key={d.code}>
                                <span className="cheat-code-dim">{d.code}</span>
                                <span className="cheat-desc">{d.short}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="cheat-heading">Valence</div>
                            {VALS.map((v) => (
                              <div className="cheat-row" key={v.code}>
                                <span className="cheat-code-val">{v.code}</span>
                                <span className="cheat-desc">{v.short}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="effects-head">
                      <div className="section-label" style={{ marginBottom: 0 }}>
                        Identified effects
                      </div>
                      <div className="effects-count">
                        {effects.length} {effects.length === 1 ? 'effect' : 'effects'}
                      </div>
                    </div>

                    <div className="effect-rows">
                      {effects.map((row, i) => (
                        <div className="effect-row" key={i}>
                          <span className="effect-num">{i + 1}</span>
                          <label className="effect-field">
                            <span>Dimension</span>
                            <select
                              value={row.dimension}
                              onChange={(e) => updateEffect(i, { dimension: e.target.value })}
                              disabled={locked}
                            >
                              <option value="">— select —</option>
                              <option value="ENV">ENV — Environmental</option>
                              <option value="SOC">SOC — Social</option>
                              <option value="IND">IND — Individual</option>
                              <option value="ECO">ECO — Economic</option>
                              <option value="TEC">TEC — Technical</option>
                            </select>
                          </label>
                          <label className="effect-field">
                            <span>Valence</span>
                            <select
                              value={row.valence}
                              onChange={(e) => updateEffect(i, { valence: e.target.value })}
                              disabled={locked}
                            >
                              <option value="">— select —</option>
                              <option value="POS">POS — Positive</option>
                              <option value="NEG">NEG — Negative</option>
                              <option value="MIX">MIX — Mixed</option>
                              <option value="CANT_TELL">CANT_TELL — Cannot tell</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            className="remove-effect"
                            title="Remove effect"
                            onClick={() => removeEffect(i)}
                            disabled={locked}
                          >
                            ×
                          </button>
                          <input
                            className="effect-note"
                            type="text"
                            value={row.coder_note}
                            onChange={(e) => updateEffect(i, { coder_note: e.target.value })}
                            placeholder="Optional note — quote or brief rationale"
                            disabled={locked}
                          />
                        </div>
                      ))}
                    </div>

                    {!locked ? (
                      <button type="button" className="add-effect" onClick={addEffect}>
                        + Add effect
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {relevance === 'not_relevant' ? (
                  <p className="not-relevant-note">
                    No effects are recorded for prompts marked not relevant.
                  </p>
                ) : null}

                <div className="footer-bar">
                  <button
                    type="button"
                    className="btn-nav"
                    onClick={() => goRelative(-1)}
                    disabled={currentIndex <= 0}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    className="btn-nav"
                    onClick={() => goRelative(1)}
                    disabled={currentIndex < 0 || currentIndex >= sortedList.length - 1}
                  >
                    Next →
                  </button>
                  <span className="validation-hint">{validationHint}</span>
                  <div className="footer-spacer" />
                  {allCoded && !locked ? (
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={() => setSubmitOpen(true)}
                    >
                      Submit all codings
                    </button>
                  ) : null}
                  {!locked ? (
                    <button
                      type="button"
                      className={`confirm-btn ${valid ? 'enabled' : 'disabled'}`}
                      disabled={!valid || saving}
                      onClick={handleConfirm}
                    >
                      {saving ? 'Saving…' : confirmLabel}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </main>

        {panelOpen ? <GuidelinesPanel onClose={() => onPanelChange(false)} /> : null}
      </div>

      {listOpen ? (
        <PromptListModal
          items={sortedList}
          currentId={prompt?.prompt_id}
          codedCount={progress.confirmed}
          totalCount={progress.total}
          onGo={goTo}
          onClose={() => setListOpen(false)}
        />
      ) : null}

      {submitOpen ? (
        <SubmitModal
          totalCount={progress.total}
          effectTotal={effectTotal}
          pidLabel={participantId}
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      ) : null}
    </div>
  )
}
