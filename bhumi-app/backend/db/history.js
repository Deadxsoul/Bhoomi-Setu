// db/history.js
// Shared helper for writing to the land_history_events audit trail — an
// append-only log so the Land History tracker can show every stage a piece
// of land has been through, with a real date, instead of just today's
// snapshot. Call this from any route that changes a parcel's or a deal's
// government-side state; it never updates or deletes existing rows.
const db = require('./init');

const insertEvent = db.prepare(`
  INSERT INTO land_history_events
    (land_id, category, event_type, title, description, status, amount, event_date,
     related_transaction_id, related_parcel_id, created_by)
  VALUES
    (@land_id, @category, @event_type, @title, @description, @status, @amount, @event_date,
     @related_transaction_id, @related_parcel_id, @created_by)
`);

function logEvent({
  land_id,
  category,
  event_type,
  title,
  description = null,
  status = 'done',
  amount = null,
  event_date = null,
  related_transaction_id = null,
  related_parcel_id = null,
  created_by = null,
}) {
  if (!land_id) return null; // nothing to attach the event to — skip quietly
  return insertEvent.run({
    land_id,
    category,
    event_type,
    title,
    description,
    status,
    amount,
    event_date: event_date || new Date().toISOString(),
    related_transaction_id,
    related_parcel_id,
    created_by,
  });
}

module.exports = { logEvent };
