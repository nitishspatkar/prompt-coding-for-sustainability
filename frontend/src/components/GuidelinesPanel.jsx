import { DIMS, VALS, RULES, SE_ACTIVITIES } from '../constants'

export default function GuidelinesPanel({ onClose }) {
  return (
    <aside className="guidelines-aside">
      <div className="guidelines-head">
        <div>
          <div className="guidelines-title">Coding guidelines</div>
          <div className="guidelines-version">Guidebook v1.1</div>
        </div>
        <button type="button" className="close-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="guidelines-body">
        <section className="guide-section">
          <div className="guide-section-head">
            <span className="guide-num">00</span>
            <h3>SE activity</h3>
          </div>
          <p>
            Assign exactly one activity for the primary request in the prompt — even when the
            prompt is not sustainability-relevant. If more than one activity seems present, pick
            the main ask.
          </p>
          <div className="dim-item" style={{ borderTop: 'none', paddingTop: 0 }}>
            {SE_ACTIVITIES.map((a) => (
              <div className="cheat-row" key={a.code} style={{ marginBottom: 10, alignItems: 'flex-start' }}>
                <span className="cheat-code-dim" style={{ width: 110, flexShrink: 0 }}>
                  {a.code}
                </span>
                <span className="cheat-desc">{a.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <div className="guide-section-head">
            <span className="guide-num">01</span>
            <h3>Deciding relevance</h3>
          </div>
          <p>
            A prompt is relevant when it names, requests, or constrains an outcome with a
            sustainability consequence: energy, resource use, wellbeing, cost, or the longevity
            of the system.
          </p>
          <div className="counts-grid">
            <div className="counts-good">
              <div className="counts-label-good">Counts</div>
              <div className="counts-text">
                Stated goals, explicit constraints, consequences the prompt clearly implies.
              </div>
            </div>
            <div className="counts-bad">
              <div className="counts-label-bad">Does not count</div>
              <div className="counts-text">
                A passing mention of a technology, or an effect you can only reach by speculation.
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <div className="guide-section-head">
            <span className="guide-num">02</span>
            <h3>The five dimensions</h3>
          </div>
          {DIMS.map((d) => (
            <div className="dim-item" key={d.code}>
              <div className="dim-item-head">
                <span className="dim-badge">{d.code}</span>
                <span className="dim-name">{d.name}</span>
              </div>
              <div className="dim-desc">{d.desc}</div>
              <div className="dim-example">{d.example}</div>
            </div>
          ))}
        </section>

        <section className="guide-section">
          <div className="guide-section-head">
            <span className="guide-num">03</span>
            <h3>Valence</h3>
          </div>
          {VALS.map((v) => (
            <div className="val-item" key={v.code}>
              <div>
                <div className="val-code">{v.code}</div>
                <div className="val-name">{v.name}</div>
              </div>
              <div className="val-desc">{v.desc}</div>
            </div>
          ))}
        </section>

        <section className="guide-section">
          <div className="guide-section-head">
            <span className="guide-num">04</span>
            <h3>Decision rules</h3>
          </div>
          {RULES.map((r) => (
            <div className="rule-item" key={r.n}>
              <span className="rule-n">{r.n}</span>
              <span className="rule-text">{r.text}</span>
            </div>
          ))}
        </section>
      </div>
    </aside>
  )
}
