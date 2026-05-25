interface VerificationEmailParams {
  firstName: string;
  verifyUrl: string;
  expiresInHours: number;
  appName: string;
  language: 'ka' | 'en';
}

const T = {
  ka: {
    subject: 'flexup — ანგარიშის გააქტიურება',
    greeting: 'გამარჯობა',
    body: 'flexup-ზე რეგისტრაციისთვის მადლობა! გთხოვთ, დააწექით ქვემოთ მოცემულ ღილაკს თქვენი ანგარიშის გასააქტიურებლად.',
    button: 'ანგარიშის გააქტიურება',
    expires: 'ეს ლინკი მოქმედებს {{hours}} საათის განმავლობაში.',
    fallback:
      'თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული თქვენი ბრაუზერის მისამართის ველში:',
    notYou:
      'თუ თქვენ არ დარეგისტრირებულხართ flexup-ზე, უბრალოდ უგულებელყავით ეს წერილი.',
    footer: 'პატივისცემით, flexup-ის გუნდი',
  },
  en: {
    subject: 'flexup — Verify your account',
    greeting: 'Hello',
    body: 'Thank you for signing up to flexup! Please click the button below to activate your account.',
    button: 'Verify Account',
    expires: 'This link is valid for {{hours}} hours.',
    fallback:
      "If the button doesn't work, copy this link into your browser's address bar:",
    notYou: "If you didn't sign up for flexup, simply ignore this email.",
    footer: 'Best regards, the flexup team',
  },
};

export function renderVerificationEmail(params: VerificationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const t = T[params.language] ?? T.en;
  const expiresText = t.expires.replace(
    '{{hours}}',
    String(params.expiresInHours),
  );

  const html = `<!DOCTYPE html>
<html lang="${params.language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans Georgian',Roboto,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;margin-bottom:24px;">
          <tr>
            <td align="center">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">${params.appName}</h1>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:600;color:#0f172a;">${t.greeting}, ${escapeHtml(params.firstName)}!</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">${t.body}</p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="${params.verifyUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">${t.button}</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;text-align:center;">${expiresText}</p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">${t.fallback}</p>
              <p style="margin:0 0 24px 0;font-size:12px;color:#3b82f6;word-break:break-all;">${params.verifyUrl}</p>

              <p style="margin:0;font-size:13px;color:#94a3b8;">${t.notYou}</p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${t.greeting}, ${params.firstName}!

${t.body}

${t.button}: ${params.verifyUrl}

${expiresText}

${t.notYou}

— ${t.footer}`;

  return { subject: t.subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
