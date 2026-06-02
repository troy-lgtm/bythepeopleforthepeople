export const dynamic = "force-static";
export const revalidate = 86400;

const BODY = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>By The People</ShortName>
  <Description>Search source-anchored civic records: federal reps, bills, local files, topics.</Description>
  <Tags>civic public records government accountability nonpartisan</Tags>
  <InputEncoding>UTF-8</InputEncoding>
  <Image height="32" width="32" type="image/svg+xml">https://bythepeopleforthepeople.com/icon.svg</Image>
  <Url type="text/html" method="get" template="https://bythepeopleforthepeople.com/search?q={searchTerms}" />
  <Url type="application/json" method="get" template="https://bythepeopleforthepeople.com/api/search-index" />
  <Url type="application/opensearchdescription+xml" rel="self" template="https://bythepeopleforthepeople.com/opensearch.xml" />
  <moz:SearchForm xmlns:moz="http://www.mozilla.org/2006/browser/search/">https://bythepeopleforthepeople.com/search</moz:SearchForm>
</OpenSearchDescription>
`;

export async function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
