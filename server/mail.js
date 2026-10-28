// Outgoing email. With RESEND_API_KEY (https://resend.com) mail is really sent; without it the message
// is printed in the server log, which is enough to develop with (copy the link from the console).
const FROM = process.env.MAIL_FROM || "Mintly <onboarding@resend.dev>";

async function send({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[mail not sent: no RESEND_API_KEY]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  });
  if (!r.ok) console.error("Email failed:", r.status, await r.text().catch(() => ""));
}

module.exports = { send };
