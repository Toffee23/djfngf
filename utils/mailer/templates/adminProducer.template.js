/**
 * Email template dispatched to system administrators when a new creator profile application commits to the database.
 * Provides a comprehensive visual ledger of applicant parameters alongside single-click moderation access hooks.
 */
export const adminProducerNotificationTemplate = (options) => {
  // Destructuring inside the function body completely bypasses the swagger-jsdoc parser parameter crash
  const {
    producerName,
    producerId,
    userId,
    email,
    productionName,
    countryOfResidence,
    prodCountry,
    bio,
    prodDesc,
    budget,
    intendedProfit,
    promoteIntent,
    whyUs,
    others,
    campaignSource,
    existingApplication,
    adminBaseUrl,
  } = options;

  const approveUrl = `${adminBaseUrl}/api/admin/producers/${producerId}/approve`;
  const rejectUrl = `${adminBaseUrl}/api/admin/producers/${producerId}/reject`;

  const row = (label, value) =>
    value
      ? `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;width:200px">${label}</td>
          <td style="padding:8px 12px;color:#222">${value}</td>
         </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>New Producer Application</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <tr>
            <td style="background:#12121a;padding:28px 36px;text-align:center">
              <h1 style="margin:0;color:#10b981;font-size:22px;letter-spacing:1px">FLIXORA</h1>
              <p style="margin:6px 0 0;color:#aaa;font-size:13px">Admin Portal · Producer Applications</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 36px 10px">
              <h2 style="margin:0;font-size:18px;color:#111">New Producer Application Submitted</h2>
              <p style="margin:8px 0 0;color:#666;font-size:14px">
                A new producer has completed the onboarding form and is awaiting your review.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 36px 24px">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px">
                <tbody>
                  ${row("Full Name", producerName)}
                  ${row("Email", email)}
                  ${row("User ID", userId)}
                  ${row("Producer ID", producerId)}
                  ${row("Production Name", productionName)}
                  ${row("Country of Residence", countryOfResidence)}
                  ${row("Production Country", prodCountry)}
                  ${row("Campaign Source", campaignSource)}
                  ${row("Existing Application", existingApplication)}
                  ${row("Budget", budget)}
                  ${row("Intended Profit", intendedProfit)}
                  ${row("Promote Intent", promoteIntent)}
                  ${row("Bio", bio)}
                  ${row("Production Description", prodDesc)}
                  ${row("Why Flixora", whyUs)}
                  ${row("Other Info", others)}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 36px">
              <p style="margin:0 0 16px;font-size:14px;color:#444;font-weight:600">Take Action:</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px">
                    <a href="${approveUrl}"
                       style="display:inline-block;padding:13px 32px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.5px">
                      ✓ Approve Producer
                    </a>
                  </td>
                  <td>
                    <a href="${rejectUrl}"
                       style="display:inline-block;padding:13px 32px;background:#ef4444;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.5px">
                      ✕ Reject Producer
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:12px;color:#999">
                Clicking a button will immediately update the producer's account status and notify them by email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="margin:0;font-size:12px;color:#aaa">Flixora Admin System · Built for Original Content</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};