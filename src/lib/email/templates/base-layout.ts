const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface BaseLayoutParams {
  preheader?: string;
  body: string;
}

export function baseLayout({ preheader, body }: BaseLayoutParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CQC Compliance</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #18181b; padding: 24px 32px; }
    .header-text { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .header-sub { color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0; }
    .content { padding: 32px; }
    .footer { padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
    .footer p { color: #71717a; font-size: 12px; line-height: 18px; margin: 0 0 8px 0; }
    h1 { color: #18181b; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; line-height: 28px; }
    h2 { color: #18181b; font-size: 17px; font-weight: 600; margin: 24px 0 12px 0; }
    p { color: #3f3f46; font-size: 15px; line-height: 24px; margin: 0 0 16px 0; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0; }
    .card { background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #71717a; font-size: 13px; }
    .card-value { color: #18181b; font-size: 15px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-good { background-color: #dcfce7; color: #166534; }
    .badge-warning { background-color: #fef9c3; color: #854d0e; }
    .badge-critical { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #dbeafe; color: #1e40af; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .metric-box { flex: 1; background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #18181b; margin: 0; }
    .metric-label { font-size: 12px; color: #71717a; margin: 4px 0 0 0; }
    .list-item { padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
    .list-item:last-child { border-bottom: none; }
    .severity-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
    .dot-critical { background-color: #ef4444; }
    .dot-high { background-color: #f97316; }
    .dot-medium { background-color: #eab308; }
    .muted { color: #71717a; font-size: 13px; }
  </style>
</head>
<body>
  <div style="background-color: #f4f4f5; padding: 40px 16px;">
    <div class="wrapper" style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div class="header">
        <p class="header-text">Consentz</p>
        <p class="header-sub">CQC Compliance Module</p>
      </div>
      <div class="content">
        ${body}
      </div>
      <div class="footer">
        <p>This is an automated message from the CQC Compliance Module by Consentz.</p>
        <p>Please do not reply to this email. If you need help, use the AI assistant inside your dashboard or contact <a href="mailto:care@consentz.com" style="color: #0d9488;">care@consentz.com</a>.</p>
        <p style="margin-top: 12px;">
          <a href="${APP_URL}/dashboard" style="color: #0d9488; text-decoration: none; margin-right: 16px;">Dashboard</a>
          <a href="${APP_URL}/settings" style="color: #0d9488; text-decoration: none;">Settings</a>
        </p>
        <p style="color: #a1a1aa; font-size: 11px; margin-top: 16px;">&copy; ${new Date().getFullYear()} Consentz. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
