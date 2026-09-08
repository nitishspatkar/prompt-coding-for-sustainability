export default function Done({ totalCount, effectTotal, pidLabel }) {
  return (
    <div className="centered-screen">
      <div className="done-card">
        <h1>Thank you — your codings are recorded.</h1>
        <p>
          {totalCount} prompts, {effectTotal} effects, submitted as {pidLabel}.
        </p>
        <p className="muted">
          You may close this window. Questions about the study can go to the address in your
          invitation email.
        </p>
      </div>
    </div>
  )
}
