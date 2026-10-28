import { jsonLdString } from "@/lib/seo";

/** Renders one or more JSON-LD graphs. Server component. */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(item) }}
        />
      ))}
    </>
  );
}
