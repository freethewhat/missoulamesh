const ROLE_LABELS = { new: 'New to MeshCore', experienced: 'Already uses MeshCore', other: 'Other' };

export function createResendSender({ apiKey, from, to, fetchImpl = fetch }) {
  return async function sendMail({ name, email, role, message }) {
    if (!apiKey || !to) throw new Error('mail not configured');
    const label = ROLE_LABELS[role] ?? 'Other';
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Missoula Mesh contact: ${label} from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nI am: ${label}\n\n${message}\n`,
      }),
    });
    if (!res.ok) throw new Error(`Resend returned ${res.status}`);
  };
}
