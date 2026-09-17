// A small horizontal stepper for the land-sale pipeline:
// Documents & Form Submitted -> Police Verification -> Sold
// (or -> Rejected, shown as a red alternate final step)
export default function StatusStepper({ status, submittedAt, approxDays, verifiedAt }) {
  const rejected = status === 'rejected';
  const sold = status === 'sold';
  const verifying = status === 'police_verification';

  const steps = [
    {
      key: 'submitted',
      label: 'Documents & Form Submitted',
      done: true,
      date: submittedAt,
    },
    {
      key: 'verification',
      label: 'Police Verification',
      done: sold || rejected,
      active: verifying,
      date: verifying ? null : verifiedAt,
    },
    rejected
      ? { key: 'rejected', label: 'Rejected', done: true, isRejected: true, date: verifiedAt }
      : { key: 'sold', label: 'Sold', done: sold, active: false, date: sold ? verifiedAt : null },
  ];

  return (
    <div className="card">
      <div className="flex items-start">
        {steps.map((s, i) => (
          <div key={s.key} className="flex-1 flex flex-col items-center text-center relative">
            {i !== 0 && (
              <div
                className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${
                  steps[i - 1].done ? (s.isRejected ? 'bg-red-400' : 'bg-moss') : 'bg-stone'
                }`}
              />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${
                s.isRejected
                  ? 'bg-red-600 text-white'
                  : s.done
                  ? 'bg-moss text-paper'
                  : s.active
                  ? 'bg-clay text-paper animate-pulse'
                  : 'bg-stone text-ink-soft'
              }`}
            >
              {s.isRejected ? '✕' : s.done ? '✓' : i + 1}
            </div>
            <p className={`mt-2 text-xs font-medium max-w-[9rem] ${s.isRejected ? 'text-red-700' : 'text-ink'}`}>{s.label}</p>
            {s.date && <p className="text-[11px] text-ink-soft mt-0.5">{new Date(s.date).toLocaleDateString('en-IN')}</p>}
            {s.active && approxDays && (
              <p className="text-[11px] text-clay-dark mt-0.5">Approx. {approxDays} working days (offline)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
