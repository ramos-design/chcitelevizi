/* ═══════════════════════════════════════════════
   Šablony e-mailů k poptávce
   Tabulkový layout + inline styly kvůli Outlooku a Gmailu.
   Barvy odpovídají tokenům v css/main.css.
   ═══════════════════════════════════════════════ */

const SITE_URL = (process.env.SITE_URL || 'https://chcitelevizi.cz').replace(/\/$/, '');
// Logo se posílá jako inline příloha (viz api/_lib/logo.js)
const LOGO_SRC = 'cid:chcitv-logo';
const PHONE = '+420 777 660 900';
const PHONE_HREF = 'tel:+420777660900';
const INFO_EMAIL = 'info@chcitelevizi.cz';
const OPENING_HOURS = 'Po–So 8:00–20:00';

const C = {
  black: '#16181c',
  mid: '#5b626d',
  page: '#eef0f4',
  card: '#ffffff',
  soft: '#f7f8fa',
  line: '#e4e7ec',
  ink: '#22252b',
  accent: '#e85c2e',
  accentBtn: '#d34617',
  accentInk: '#bf3f15',
  accentOnInk: '#f2733f',
  tint: '#fdeee8',
};
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const escMultiline = (value) => esc(value).replace(/\n/g, '<br>');

function formatDate(date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

// "Standard (3 500 Kč)" → { name: "Standard", price: "3 500 Kč" }
function parseTarif(value) {
  const name = value.split(/\s+[–(]/)[0].trim() || value;
  const price = (value.match(/\(([^)]+)\)/) || [])[1] || '';
  return { name, price };
}

// Vlastní odkazy – jinak z nich Gmail udělá modrý podtržený text
const telLink = (phone, color = C.black) =>
  `<a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" style="color:${color};text-decoration:none;">${esc(phone)}</a>`;
const mailLink = (email, color = C.black) =>
  `<a href="mailto:${esc(email)}" style="color:${color};text-decoration:none;">${esc(email)}</a>`;

function contactPromise(d) {
  switch (d.kontaktZpusob) {
    case 'E-mailem': return `napíšeme vám na <strong>${mailLink(d.email)}</strong>`;
    case 'SMS / WhatsApp': return `ozveme se přes SMS / WhatsApp na <strong>${telLink(d.telefon)}</strong>`;
    case 'Telefonicky': return `zavoláme vám na <strong>${telLink(d.telefon)}</strong>`;
    default: return `ozveme se vám na <strong>${telLink(d.telefon)}</strong> nebo e-mailem`;
  }
}

/* ── společná kostra ── */
function layout({ preheader, content, footer }) {
  return `<!DOCTYPE html>
<html lang="cs" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Chci televizi</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${C.page}; }
  a { color:${C.accentInk}; }
  @media (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:26px !important; line-height:32px !important; }
    .stack { display:block !important; width:100% !important; }
    .stack-gap { padding-top:10px !important; padding-left:0 !important; }
    .btn a { display:block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.card};border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(22,24,28,.06);">
        <tr><td style="height:5px;line-height:5px;font-size:0;background:${C.accent};">&nbsp;</td></tr>
        <tr>
          <td class="px" style="padding:28px 40px 8px;">
            <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_SRC}" width="150" height="50" alt="Chci televizi" style="display:block;width:150px;height:50px;border:0;outline:none;"></a>
          </td>
        </tr>
        ${content}
      </table>
      ${footer}
    </td>
  </tr>
</table>
</body>
</html>`;
}

function detailRows(rows) {
  return rows
    .filter(([, value]) => value)
    .map(([label, value], i) => `
      <tr>
        <td class="stack" valign="top" style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ''}width:150px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.mid};">${esc(label)}</td>
        <td class="stack stack-gap" valign="top" style="padding:12px 0 12px 12px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT};font-size:15px;line-height:22px;color:${C.black};font-weight:500;">${value}</td>
      </tr>`)
    .join('');
}

/* ═══ Potvrzení zákazníkovi ═══ */
function buildCustomerEmail(d, ctx) {
  const tarif = parseTarif(d.tarif);
  const subject = 'Poptávku máme – ozveme se do 2 hodin | Chci televizi';
  const preheader = 'Děkujeme za důvěru. Technik se vám ozve do 2 hodin v pracovní době.';

  const tarifBadge = `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${C.tint};color:${C.accentInk};font-weight:700;font-size:14px;">${esc(tarif.name)}</span>${tarif.price ? `<span style="color:${C.mid};font-size:14px;">&nbsp;&nbsp;${esc(tarif.price)}</span>` : ''}`;

  const steps = [
    ['Ozveme se vám', `Do 2 hodin v pracovní době (${OPENING_HOURS}) probereme detaily a zodpovíme vaše dotazy.`],
    ['Domluvíme termín a cenu', 'Vše víte dopředu – žádné skryté poplatky a nic neplatíte předem.'],
    ['Postaráme se o zbytek', 'Od doporučení správné televize přes montáž na zeď až po nastavení všech aplikací.'],
  ];
  const stepsHtml = steps.map(([title, text], i) => `
    <tr>
      <td valign="top" width="44" style="padding:${i ? '16px' : '0'} 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" valign="middle" width="30" height="30" style="width:30px;height:30px;border-radius:15px;background:${C.accent};color:#ffffff;font-family:${FONT};font-size:14px;font-weight:700;line-height:30px;">${i + 1}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding:${i ? '16px' : '0'} 0 0;font-family:${FONT};">
        <div style="font-size:16px;line-height:22px;font-weight:700;color:${C.black};">${title}</div>
        <div style="padding-top:3px;font-size:14px;line-height:21px;color:${C.mid};">${text}</div>
      </td>
    </tr>`).join('');

  const content = `
    <tr>
      <td class="px" style="padding:28px 40px 0;font-family:${FONT};">
        <div style="font-size:12px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${C.accentInk};">✓&nbsp; Poptávka přijata</div>
        <h1 class="h1" style="margin:10px 0 0;font-size:30px;line-height:36px;font-weight:800;color:${C.black};letter-spacing:-0.5px;">Děkujeme, ${esc(d.jmeno)}!</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:25px;color:${C.black};">Vaši poptávku jsme v pořádku přijali. Do 2 hodin v pracovní době ${contactPromise(d)}.</p>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border:1px solid ${C.line};border-radius:14px;">
          <tr>
            <td style="padding:20px 24px 8px;font-family:${FONT};font-size:13px;line-height:18px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${C.mid};">Shrnutí poptávky</td>
          </tr>
          <tr>
            <td style="padding:0 24px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${detailRows([
                  ['Služba', tarifBadge],
                  ['Jméno', esc(`${d.jmeno} ${d.prijmeni}`)],
                  ['Telefon', telLink(d.telefon)],
                  ['E-mail', mailLink(d.email)],
                  ['Lokalita', esc(d.lokalita)],
                  ['Kontaktovat', esc(d.kontaktZpusob)],
                  ['Poznámka', d.poznamka ? `<span style="font-weight:400;">${escMultiline(d.poznamka)}</span>` : ''],
                ])}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:32px 40px 0;font-family:${FONT};">
        <div style="font-size:19px;line-height:26px;font-weight:800;color:${C.black};padding-bottom:16px;">Co bude následovat</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepsHtml}</table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:32px 40px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};border-radius:14px;">
          <tr>
            <td style="padding:26px 28px;font-family:${FONT};">
              <div style="font-size:18px;line-height:24px;font-weight:700;color:#ffffff;">Nechcete čekat?</div>
              <div style="padding-top:4px;font-size:14px;line-height:21px;color:rgba(255,255,255,.72);">Zavolejte nám rovnou – ${OPENING_HOURS}.</div>
              <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
                <tr>
                  <td align="center" style="border-radius:10px;background:${C.accentBtn};">
                    <a href="${PHONE_HREF}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">📞&nbsp; ${PHONE}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  const footer = `
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr>
          <td class="px" align="center" style="padding:24px 40px 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.mid};">
            <strong style="color:${C.black};">Chci televizi</strong> · montáž a nastavení televizí<br>
            <a href="${SITE_URL}" style="color:${C.mid};">chcitelevizi.cz</a> · <a href="mailto:${INFO_EMAIL}" style="color:${C.mid};">${INFO_EMAIL}</a> · <a href="${PHONE_HREF}" style="color:${C.mid};text-decoration:none;">${PHONE}</a>
          </td>
        </tr>
        <tr>
          <td class="px" align="center" style="padding:6px 40px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#8a909a;">
            Tento e-mail jste obdrželi, protože jste na chcitelevizi.cz odeslali poptávku.<br>Na tuto zprávu můžete rovnou odpovědět.
          </td>
        </tr>
      </table>`;

  const text = [
    `Děkujeme, ${d.jmeno}!`,
    '',
    'Vaši poptávku jsme v pořádku přijali. Ozveme se vám do 2 hodin v pracovní době.',
    '',
    'SHRNUTÍ POPTÁVKY',
    `Služba: ${d.tarif}`,
    `Jméno: ${d.jmeno} ${d.prijmeni}`,
    `Telefon: ${d.telefon}`,
    `E-mail: ${d.email}`,
    d.lokalita ? `Lokalita: ${d.lokalita}` : null,
    d.kontaktZpusob ? `Kontaktovat: ${d.kontaktZpusob}` : null,
    d.poznamka ? `Poznámka:\n${d.poznamka}` : null,
    '',
    'CO BUDE NÁSLEDOVAT',
    ...steps.map(([title, body], i) => `${i + 1}. ${title} – ${body}`),
    '',
    `Nechcete čekat? Zavolejte nám: ${PHONE} (${OPENING_HOURS})`,
    '',
    '—',
    `Chci televizi · ${SITE_URL.replace(/^https?:\/\//, '')} · ${INFO_EMAIL}`,
  ].filter((line) => line !== null).join('\n');

  return { subject, html: layout({ preheader, content, footer }), text };
}

/* ═══ Notifikace týmu ═══ */
function buildTeamEmail(d, ctx) {
  const tarif = parseTarif(d.tarif);
  const fullName = `${d.jmeno} ${d.prijmeni}`;
  const subject = `Nová poptávka: ${tarif.name} – ${fullName}`;
  const preheader = `${fullName} · ${d.telefon} · ${d.lokalita || 'lokalita neuvedena'}`;
  const telHref = `tel:${d.telefon.replace(/[^\d+]/g, '')}`;
  const when = formatDate(ctx.submittedAt);

  const button = (href, label, primary) => `
    <td class="stack${primary ? '' : ' stack-gap'}" style="${primary ? '' : 'padding-left:10px;'}">
      <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td align="center" style="border-radius:10px;background:${primary ? C.accentBtn : C.card};${primary ? '' : `border:1px solid ${C.line};`}">
          <a href="${href}" style="display:block;padding:12px 18px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${primary ? '#ffffff' : C.black};text-decoration:none;border-radius:10px;">${label}</a>
        </td>
      </tr></table>
    </td>`;

  const content = `
    <tr>
      <td class="px" style="padding:24px 40px 0;font-family:${FONT};">
        <div style="font-size:12px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${C.accentInk};">Nová poptávka z webu</div>
        <h1 class="h1" style="margin:8px 0 0;font-size:28px;line-height:34px;font-weight:800;color:${C.black};letter-spacing:-0.5px;">${esc(fullName)}</h1>
        <p style="margin:8px 0 0;font-size:15px;line-height:22px;color:${C.mid};">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${C.tint};color:${C.accentInk};font-weight:700;">${esc(tarif.name)}</span>${tarif.price ? `&nbsp; ${esc(tarif.price)}` : ''}${d.lokalita ? ` &nbsp;·&nbsp; ${esc(d.lokalita)}` : ''}
        </p>
      </td>
    </tr>
    <tr>
      <td class="px" style="padding:22px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${button(telHref, `📞&nbsp; Zavolat ${esc(d.telefon)}`, true)}
          ${button(`mailto:${encodeURIComponent(d.email)}`, '✉️&nbsp; Napsat e-mail', false)}
        </tr></table>
      </td>
    </tr>
    <tr>
      <td class="px" style="padding:22px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${detailRows([
            ['Služba', esc(d.tarif)],
            ['Telefon', `<a href="${telHref}" style="color:${C.black};text-decoration:none;">${esc(d.telefon)}</a>`],
            ['E-mail', `<a href="mailto:${encodeURIComponent(d.email)}" style="color:${C.accentInk};">${esc(d.email)}</a>`],
            ['Lokalita', esc(d.lokalita)],
            ['Preferuje kontakt', `<strong style="color:${C.accentInk};">${esc(d.kontaktZpusob || 'Nezáleží')}</strong>`],
          ])}
        </table>
      </td>
    </tr>
    ${d.poznamka ? `
    <tr>
      <td class="px" style="padding:16px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-left:4px solid ${C.accent};border-radius:0 10px 10px 0;">
          <tr><td style="padding:16px 20px;font-family:${FONT};">
            <div style="font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${C.mid};">Poznámka</div>
            <div style="padding-top:6px;font-size:15px;line-height:23px;color:${C.black};">${escMultiline(d.poznamka)}</div>
          </td></tr>
        </table>
      </td>
    </tr>` : ''}
    <tr>
      <td class="px" style="padding:24px 40px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.mid};">
        Odesláno ${esc(when)} · Na tento e-mail stačí odpovědět – odpověď půjde přímo zákazníkovi.
      </td>
    </tr>`;

  const footer = `
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td align="center" style="padding:18px 20px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#8a909a;">Formulář chcitelevizi.cz · ID ${esc(ctx.id)}</td></tr>
      </table>`;

  const text = [
    `NOVÁ POPTÁVKA – ${fullName}`,
    '',
    `Služba: ${d.tarif}`,
    `Telefon: ${d.telefon}`,
    `E-mail: ${d.email}`,
    `Lokalita: ${d.lokalita || '—'}`,
    `Preferuje kontakt: ${d.kontaktZpusob || 'Nezáleží'}`,
    '',
    `Poznámka:\n${d.poznamka || '—'}`,
    '',
    `Odesláno ${when} · ID ${ctx.id}`,
  ].join('\n');

  return { subject, html: layout({ preheader, content, footer }), text };
}

module.exports = { buildCustomerEmail, buildTeamEmail };
