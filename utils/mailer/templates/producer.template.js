/**
 * Global Flixora Transactional Email Layout Framework
 * Prevents execution leaks by decoupling the wrapper into a clean local renderer block.
 */
const renderEmailLayout = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Flixora</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <tr>
            <td style="background:#12121a;padding:28px 36px;text-align:center">
              <h1 style="margin:0;color:#10b981;font-size:24px;letter-spacing:2px;font-weight:800">FLIXORA</h1>
              <p style="margin:6px 0 0;color:#aaa;font-size:12px;letter-spacing:1px;text-transform:uppercase">Built for Original Content</p>
            </td>
          </tr>

          ${content}

          <tr>
            <td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="margin:0 0 4px;font-size:12px;color:#aaa">© Flixora · Built for Original Content</p>
              <p style="margin:0;font-size:12px;color:#aaa">
                <a href="https://www.flixora.co.uk" style="color:#10b981;text-decoration:none">www.flixora.co.uk</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Producer Application Status: APPROVED
 */
export const producerApprovalTemplate = (name) => {
  const steps = [
    "Sign in using your temporary login credentials provided during your application.",
    "Access your <strong>Producer Dashboard</strong> to explore platform features and upload tools.",
    "Update your credentials immediately — change your password under <strong>Settings</strong>.",
    "Complete your producer profile including production details, bio, and branding.",
    "Review our <strong>Community Guidelines</strong> and Content Policies before uploading.",
  ];

  const stepsHtml = steps
    .map(
      (step) => `
    <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;width:100%">
      <tr>
        <td style="vertical-align:top;padding-right:10px;color:#10b981;font-size:16px;font-weight:700;width:20px">✓</td>
        <td style="font-size:14px;color:#333;line-height:1.6">${step}</td>
      </tr>
    </table>`
    )
    .join(""); // Explicitly joined to eliminate array comma injection bugs on Outlook clients

  return renderEmailLayout(`
  <tr>
    <td style="background:linear-gradient(135deg,#064e3b,#10b981);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">🎬</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">You're Approved!</h2>
      <p style="margin:8px 0 0;color:#d1fae5;font-size:14px">Welcome to the Flixora Producers Network</p>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Dear <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        Congratulations! We are pleased to officially inform you that your application for the
        <strong>Flixora Producers Program</strong> has been successfully reviewed and approved.
        After careful evaluation, you have qualified to join our growing network of filmmakers
        and content creators committed to delivering original, high-quality productions to a global audience.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:8px 36px 8px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:6px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.5px">Next Steps</p>
            ${stepsHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:16px 36px 8px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px">⚠ Compliance Notice</p>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.7">
              All films, trailers, and uploaded content <strong>must</strong> fully comply with Flixora's Community Guidelines,
              copyright policies, and content standards. Violations may result in content removal or account suspension.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 36px;text-align:center">
      <a href="https://www.flixora.co.uk/dashboard"
         style="display:inline-block;padding:14px 40px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.5px">
        Go to My Dashboard →
      </a>
    </td>
  </tr>
  `);
};

/**
 * Producer Application Status: REJECTED
 */
export const producerRejectedTemplate = (name) => {
  return renderEmailLayout(`
  <tr>
    <td style="background:linear-gradient(135deg,#1c1c2e,#374151);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">📋</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Application Update</h2>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:14px">Flixora Producers Program</p>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Dear <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        Thank you for your interest in joining the <strong>Flixora Producers Program</strong>.
        After careful consideration by our review team, we regret to inform you that your application was
        not successful at this time.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:8px 36px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:6px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065f46">💳 Refund Information</p>
            <p style="margin:0;font-size:14px;color:#333;line-height:1.7">
              As part of our commitment to fairness and transparency, we have initiated a <strong>full refund</strong>
              of your application fee of <strong>$100 USD</strong> to your original payment method.
              Funds should reflect within <strong>2 working days</strong>.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `);
};

/**
 * Producer Application Status: REVISION REQUIRED
 */
export const infoNeededTemplate = (name) => {
  const requirements = [
    "Additional details regarding your academic or professional background in filmmaking, cinematography, or directing.",
    "Access to previous film projects — streaming links, trailers, showreels, portfolios, or IMDb profiles.",
    "A more comprehensive review of your production experience, storytelling approach, and technical capabilities.",
    "A possible virtual interview with our onboarding and creative evaluation team for further assessment.",
  ];

  const requirementsHtml = requirements
    .map(
      (item, i) => `
    <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;width:100%">
      <tr>
        <td style="vertical-align:top;padding-right:12px;width:24px">
          <div style="background:#2563eb;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;font-size:12px;font-weight:700;line-height:22px">${i + 1}</div>
        </td>
        <td style="font-size:14px;color:#333;line-height:1.6">${item}</td>
      </tr>
    </table>`
    )
    .join("");

  return renderEmailLayout(`
  <tr>
    <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">📎</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Additional Information Required</h2>
      <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px">Flixora Producers Program — Application Review</p>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Dear <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        Your application requires further review and additional supporting documents before we can proceed to the next stage.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:0 36px 8px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px">Our review team currently requires:</p>
            ${requirementsHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:16px 36px 8px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px">
        <tr>
          <td style="padding:18px 24px">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.7">
              <strong>⚠ Please note:</strong> Your producer account will remain on <strong>pending review</strong> until a final decision is made.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 36px;text-align:center">
      <a href="mailto:support@flixora.co.uk"
         style="display:inline-block;padding:14px 40px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.5px">
        Contact Support →
      </a>
    </td>
  </tr>
  `);
};