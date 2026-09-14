import { useState } from 'react'
import GuidebookModal from './GuidebookModal'

export default function Orientation({ onContinue }) {
  const [guidebookOpen, setGuidebookOpen] = useState(false)

  return (
    <div className="centered-screen">
      <div className="purpose-card">
        <div className="purpose-body">
          <p>
            You will read a set of prompts that practitioners wrote for AI coding assistants.
            For each prompt, decide whether it contains content relevant to software
            sustainability.
          </p>
          <p>
            If a prompt is relevant, record every sustainability effect you can identify. An
            effect is described by the dimension it acts on and the valence of that effect. A
            prompt may carry several effects across several dimensions.
          </p>
          <p>
            Code only what the prompt text states or clearly implies. Do not infer effects from
            the technology stack alone, and do not judge the quality of the prompt.
          </p>
          <p>
            Please read the <strong>Coding Guidebook</strong> once before you start (quick
            reference in this tool). You can open it again anytime from{' '}
            <strong>Open guidebook</strong> in the header while coding.
          </p>
        </div>
        <p className="purpose-resume">
          Each prompt is saved the moment you confirm it. You can close the tab at any point and
          resume where you left off by signing in with the same participant ID.
        </p>
        <div className="purpose-actions">
          <button type="button" className="btn-primary" onClick={onContinue}>
            Start coding
          </button>
          <button type="button" className="btn-secondary" onClick={() => setGuidebookOpen(true)}>
            Open guidebook
          </button>
        </div>
      </div>
      {guidebookOpen ? <GuidebookModal onClose={() => setGuidebookOpen(false)} /> : null}
    </div>
  )
}
