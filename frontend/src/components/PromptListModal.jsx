export default function PromptListModal({
  items,
  currentId,
  codedCount,
  totalCount,
  onGo,
  onClose,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="list-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="All prompts"
      >
        <div className="list-modal-head">
          <div className="list-modal-title">All prompts</div>
          <div className="list-modal-sub">
            {codedCount}/{totalCount} coded
          </div>
          <div className="header-spacer" />
          <button type="button" className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="list-modal-body">
          {items.map((it) => {
            let status = 'not coded'
            let statusColor = '#a8a19a'
            if (it.is_confirmed) {
              status =
                it.is_relevant === false
                  ? 'coded · not relevant'
                  : `coded · ${it.effect_count} eff.`
              statusColor = '#3d6b4f'
            } else if (it.opened_at) {
              status = 'in progress'
              statusColor = '#7a6a3c'
            }
            return (
              <button
                key={it.prompt_id}
                type="button"
                className={`list-row${it.prompt_id === currentId ? ' current' : ''}`}
                onClick={() => onGo(it.prompt_id)}
              >
                <span className="list-id">{it.prompt_id}</span>
                <span className="list-preview">{it.prompt_text}</span>
                <span className="list-status" style={{ color: statusColor }}>
                  {status}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
