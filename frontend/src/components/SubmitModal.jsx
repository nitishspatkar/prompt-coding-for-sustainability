export default function SubmitModal({
  totalCount,
  effectTotal,
  pidLabel,
  onClose,
  onSubmit,
  submitting,
}) {
  return (
    <div className="modal-backdrop center" onClick={onClose} role="presentation">
      <div
        className="submit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Submit confirmation"
      >
        <h2>Submit your codings?</h2>
        <p>
          You are submitting {totalCount} coded prompts with {effectTotal} recorded effects as{' '}
          {pidLabel}.
        </p>
        <p style={{ marginBottom: 0 }}>
          After submission the set becomes read-only and you cannot change your decisions.
        </p>
        <div className="submit-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Keep editing
          </button>
          <button type="button" className="btn-accent" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit and finish'}
          </button>
        </div>
      </div>
    </div>
  )
}
