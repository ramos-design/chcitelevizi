/* ═══════════════════════════════════════════════
   POST /api/poptavka — odeslání poptávkového formuláře přes Resend
   1) notifikace týmu (Reply-To = zákazník)
   2) potvrzení zákazníkovi
   Env: RESEND_API_KEY (povinné, full access kvůli čtení kontaktů),
        POPTAVKA_SEGMENT_ID – příjemci notifikace = kontakty v tomto Resend segmentu,
        POPTAVKA_TO – záložní příjemci, když je segment prázdný / nedostupný,
        POPTAVKA_FROM, POPTAVKA_REPLY_TO
   ═══════════════════════════════════════════════ */
const crypto = require('crypto');
const { Resend } = require('resend');
const { buildCustomerEmail, buildTeamEmail } = require('./_lib/poptavka-emails');
const LOGO_ATTACHMENT = require('./_lib/logo');

const FROM = process.env.POPTAVKA_FROM || 'Chci televizi <poptavka@chcitelevizi.cz>';
const REPLY_TO = process.env.POPTAVKA_REPLY_TO || 'info@chcitelevizi.cz';
const TEAM_TO = (process.env.POPTAVKA_TO || 'info@chcitelevizi.cz')
  .split(',').map((s) => s.trim()).filter(Boolean);

// Maximální délky polí; poznámka jako jediná smí mít více řádků
const LIMITS = {
  tarif: 120, jmeno: 80, prijmeni: 80, telefon: 40, email: 254,
  lokalita: 160, kontaktZpusob: 40, poznamka: 4000,
};
const REQUIRED = ['tarif', 'jmeno', 'prijmeni', 'telefon', 'email'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// SDK nevyhazuje výjimky – vrací { data, error }. Opakujeme jen rate limit / výpadky.
// U odesílání je opakování bezpečné díky idempotency key.
async function withRetry(call, attempts = 3) {
  let result;
  for (let i = 0; i < attempts; i += 1) {
    result = await call();
    const status = result.error ? result.error.statusCode : 0;
    const retryable = result.error && (status === 429 || status === null || status >= 500);
    if (!retryable) return result;
    await sleep(700 * (i + 1));
  }
  return result;
}

// Příjemci notifikace se spravují v Resendu (Audience → Segments).
// Odhlášený kontakt (Unsubscribed) notifikace nedostává – dá se tak dočasně vypnout.
async function getTeamRecipients(resend) {
  const segmentId = process.env.POPTAVKA_SEGMENT_ID;
  if (!segmentId) return TEAM_TO;

  const { data, error } = await withRetry(() => resend.contacts.list({ segmentId, limit: 50 }));
  if (error) {
    console.error('[poptavka] Nelze načíst příjemce ze segmentu, použije se POPTAVKA_TO:', error);
    return TEAM_TO;
  }
  const emails = ((data && data.data) || [])
    .filter((contact) => !contact.unsubscribed && EMAIL_RE.test(contact.email))
    .map((contact) => contact.email);
  return emails.length ? emails : TEAM_TO;
}

function clean(value, max, multiline) {
  if (typeof value !== 'string') return '';
  const text = multiline
    ? value.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n')
    : value.replace(/\s+/g, ' ');
  return text.trim().slice(0, max);
}

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { ok: false, error: 'Metoda není povolena.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[poptavka] Chybí RESEND_API_KEY');
    return reply(res, 500, { ok: false, error: 'Odesílání je dočasně nedostupné. Zavolejte nám prosím.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return reply(res, 400, { ok: false, error: 'Neplatný požadavek.' });
  }

  // Honeypot – skryté pole vyplňují jen roboti. Tváříme se, že vše prošlo.
  if (clean(body.web, 200)) return reply(res, 200, { ok: true });

  const data = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    data[key] = clean(body[key], max, key === 'poznamka');
  }

  const missing = REQUIRED.filter((key) => !data[key]);
  if (data.email && !EMAIL_RE.test(data.email)) missing.push('email');
  if (missing.length || body.gdpr !== true) {
    return reply(res, 422, {
      ok: false,
      error: 'Zkontrolujte prosím povinná pole a souhlas se zpracováním údajů.',
      fields: [...new Set(missing)],
    });
  }

  // ID z prohlížeče chrání před dvojitým odesláním (idempotence u Resendu)
  const id = typeof body.id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(body.id)
    ? body.id
    : crypto.randomUUID();
  const ctx = { id, submittedAt: new Date() };

  const resend = new Resend(apiKey);

  const team = buildTeamEmail(data, ctx);
  const teamTo = await getTeamRecipients(resend);
  const { error: teamError } = await withRetry(() => resend.emails.send(
    {
      from: FROM,
      to: teamTo,
      replyTo: data.email,
      subject: team.subject,
      html: team.html,
      text: team.text,
      attachments: [LOGO_ATTACHMENT],
      tags: [{ name: 'category', value: 'poptavka_tym' }],
    },
    { idempotencyKey: `poptavka-tym/${id}` }
  ));

  if (teamError) {
    console.error('[poptavka] Notifikace týmu selhala:', teamError);
    return reply(res, 502, { ok: false, error: 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám zavolejte.' });
  }

  // Potvrzení zákazníkovi – když selže, poptávka už je u nás, takže uživateli hlásíme úspěch
  const customer = buildCustomerEmail(data, ctx);
  const { error: customerError } = await withRetry(() => resend.emails.send(
    {
      from: FROM,
      to: [data.email],
      replyTo: REPLY_TO,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
      attachments: [LOGO_ATTACHMENT],
      tags: [{ name: 'category', value: 'poptavka_potvrzeni' }],
    },
    { idempotencyKey: `poptavka-zakaznik/${id}` }
  ));

  if (customerError) {
    console.error('[poptavka] Potvrzení zákazníkovi selhalo:', customerError);
  }

  return reply(res, 200, { ok: true, confirmationSent: !customerError });
};
