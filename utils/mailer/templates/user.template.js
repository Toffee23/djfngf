const layout = (content) => `<!DOCTYPE html>
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

          <!-- Header -->
          <tr>
            <td style="background:#12121a;padding:28px 36px;text-align:center">
              <h1 style="margin:0;color:#10b981;font-size:24px;letter-spacing:2px;font-weight:800">FLIXORA</h1>
              <p style="margin:6px 0 0;color:#666;font-size:12px;letter-spacing:1px;text-transform:uppercase">Built for Original Content</p>
            </td>
          </tr>

          ${content}

          <!-- Footer -->
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

//  Friend Recommendation

export const friendRecommendationTemplate = (
  name,
  { movieTitle, movieUrl, senderName } = {},
) =>
  layout(`
  <!-- Banner -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">🎥</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Your Friend Has a Recommendation</h2>
      <p style="margin:8px 0 0;color:#93c5fd;font-size:14px">Someone thinks you'll love this one</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Hey <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        ${senderName ? `<strong>${senderName}</strong> just finished` : "A friend just finished"} watching a movie on Flixora and had to pass it on immediately.
        The film was incredibly well-produced — strong storyline, amazing cinematography, and performances
        that kept them engaged from beginning to end.
      </p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        What stood out most was how original and cinematic it felt. The pacing, soundtrack, and overall
        production quality were genuinely impressive. If you're into quality storytelling and well-made films,
        this one's for you.
      </p>
    </td>
  </tr>

  ${
    movieTitle
      ? `
  <!-- Movie Card -->
  <tr>
    <td style="padding:8px 36px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px">Now Streaming on Flixora</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#111">${movieTitle}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
      : ""
  }

  <!-- CTA -->
  <tr>
    <td style="padding:24px 36px;text-align:center">
      <a href="${movieUrl || "https://www.flixora.co.uk"}"
         style="display:inline-block;padding:14px 40px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.5px">
        Watch Now on Flixora →
      </a>
    </td>
  </tr>

  <!-- Sign-off -->
  <tr>
    <td style="padding:0 36px 32px">
      <p style="margin:0;font-size:14px;color:#333;line-height:1.7">
        Once you've seen it, let your friend know what you think. Enjoy!
      </p>
      <p style="margin:16px 0 0;font-size:14px;color:#333">Best,</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#111">${senderName || "Your Friend"} via Flixora</p>
    </td>
  </tr>
`);

//  Watch-Along Invitation

export const watchAlongTemplate = (
  name,
  { senderName, movieTitle, dateTime, joinUrl } = {},
) =>
  layout(`
  <!-- Banner -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a0533,#7c3aed);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">🍿</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">You're Invited to a Watch Along</h2>
      <p style="margin:8px 0 0;color:#ddd6fe;font-size:14px">Stream together in real time on Flixora</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Hey <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        ${senderName ? `<strong>${senderName}</strong> found` : "Someone found"} an amazing movie on Flixora and would love for you both to watch it together
        using the <strong>Watch Along</strong> feature — stream simultaneously in real time, no matter where you are.
      </p>
    </td>
  </tr>

  <!-- Event Details -->
  <tr>
    <td style="padding:0 36px 8px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:6px">
        <tr>
          <td style="padding:20px 24px">
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:0.5px">Session Details</p>
            <table cellpadding="0" cellspacing="0" style="width:100%">
              <tr>
                <td style="font-size:13px;color:#666;padding-bottom:8px;width:120px;font-weight:600">🎬 Movie</td>
                <td style="font-size:14px;color:#111;padding-bottom:8px;font-weight:700">${movieTitle || "To be announced"}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#666;font-weight:600">📅 Date & Time</td>
                <td style="font-size:14px;color:#111;font-weight:700">${dateTime || "To be confirmed"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:28px 36px;text-align:center">
      <a href="${joinUrl || "https://www.flixora.co.uk"}"
         style="display:inline-block;padding:16px 48px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:16px;letter-spacing:0.5px">
        🎬 Join Watch Along
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#aaa">Click the button above to join the session at the scheduled time.</p>
    </td>
  </tr>

  <!-- Sign-off -->
  <tr>
    <td style="padding:0 36px 32px">
      <p style="margin:0;font-size:14px;color:#333;line-height:1.7">
        Looking forward to watching together. See you on Flixora!
      </p>
      <p style="margin:16px 0 0;font-size:14px;color:#333">Best,</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#111">${senderName || "Your Friend"} via Flixora</p>
    </td>
  </tr>
`);

//  System Recommendation

export const systemRecommendationTemplate = (name, { movies } = {}) => {
  const defaultMovies = [
    "Shadow Legacy",
    "Beyond Tomorrow",
    "Lost in Lagos",
    "The Last Frame",
  ];
  const movieList = movies || defaultMovies;

  return layout(`
  <!-- Banner -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f1923,#10b981);padding:32px 36px;text-align:center">
      <div style="font-size:44px;margin-bottom:10px">🍿</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Picked for You</h2>
      <p style="margin:8px 0 0;color:#d1fae5;font-size:14px">Trending originals we think you'll love</p>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style="padding:32px 36px 16px">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7">Hi <strong>${name}</strong>,</p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        Looking for something new to watch? We've picked out trending and original movies we think
        you'll love — now streaming on Flixora.
      </p>
      <p style="margin:12px 0 0;font-size:15px;color:#333;line-height:1.7">
        From powerful independent stories to global cinematic experiences, discover films created
        by filmmakers around the world, all in one place.
      </p>
    </td>
  </tr>

  <!-- Movie List -->
  <tr>
    <td style="padding:8px 36px 24px">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.5px">🎬 Trending Now</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${movieList
          .map(
            (movie, i) => `
        <tr>
          <td style="padding:10px 16px;background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};border-radius:6px;margin-bottom:4px">
            <table cellpadding="0" cellspacing="0" style="width:100%">
              <tr>
                <td style="font-size:14px;color:#111;font-weight:600">
                  <span style="color:#10b981;margin-right:8px">▶</span>${typeof movie === "object" ? movie.title : movie}
                </td>
                ${
                  typeof movie === "object" && movie.url
                    ? `
                <td style="text-align:right">
                  <a href="${movie.url}" style="font-size:12px;color:#10b981;text-decoration:none;font-weight:600">Watch →</a>
                </td>`
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:4px"></td></tr>`,
          )
          .join("")}
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:0 36px 32px;text-align:center">
      <a href="https://www.flixora.co.uk"
         style="display:inline-block;padding:14px 40px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.5px">
        Start Streaming Now →
      </a>
      <p style="margin:16px 0 0;font-size:13px;color:#999">Thank you for being part of the Flixora community.</p>
    </td>
  </tr>
`);
};
