export const dynamic = "force-static";
export const revalidate = 86400;

function expiresIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

const BODY = `# Security disclosure policy (RFC 9116)
Contact: mailto:security@bythepeopleforthepeople.com
Expires: ${expiresIn(180)}
Preferred-Languages: en
Canonical: https://bythepeopleforthepeople.com/.well-known/security.txt
Policy: https://bythepeopleforthepeople.com/security
Acknowledgments: https://bythepeopleforthepeople.com/humans.txt

# Reports we want
# - Authentication or session bypass
# - Server-side request forgery or remote code execution
# - Personal-data exposure (we collect almost none, but anything beyond the place cookie is a bug)
# - Source-trail tampering or integrity holes
# - DNS/SSL/email-spoofing risks for the domain

# Reports we do not want
# - Missing security headers without a working exploit chain
# - Tabnabbing on outbound source links (we use rel=noreferrer)
# - Lack of rate limiting on public API endpoints (intentional fair-use access)

# Acknowledgment
# We try to reply within 5 business days. We will not pursue legal action
# against good-faith research conducted under common-sense norms (do not
# exfiltrate user data, do not disrupt service, do not retain personal data,
# respect robots.txt).
`;

export async function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
