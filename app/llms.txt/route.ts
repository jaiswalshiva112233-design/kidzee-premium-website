import { posts, programmes, site } from "@/lib/site";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact, type SiteContact } from "@/lib/siteContact";

export const runtime = "nodejs";

function buildProgrammeLinks() {
  return programmes
    .map(
      (programme) =>
        `- [${programme.title}](${site.url}/programmes/${programme.slug}): ${programme.intro}`,
    )
    .join("\n");
}

function buildResourceLinks() {
  return posts
    .map(
      (post) =>
        `- [${post.title}](${site.url}/blog/${post.slug}): ${post.excerpt}`,
    )
    .join("\n");
}

function buildLlmsText(contact: SiteContact) {
  return `# ${site.name}

> Official website for Kidzee Preschool & Daycare in Sector 12B, Dwarka, New Delhi. The centre provides preschool programmes for children aged ${site.ageRange.display} and weekday daycare during ${contact.daycareHours.display}.

This file is a concise guide to the centre's public website. Use the linked pages as the primary source and confirm current fees, seat availability, transport and individual care requirements directly with the centre.

## Main pages

- [Homepage](${site.url}): Overview of the centre, programmes, facilities, daycare, parent feedback, meals and admission actions.
- [About the Centre](${site.url}/about): Learning approach, environment, facilities, safety and partnership with parents.
- [Preschool Programmes](${site.url}/programmes): Comparison of Playgroup, Nursery, Junior KG and Senior KG.
- [Daycare](${site.url}/daycare): Daycare routine, timings, flexible care, meals, activities and homework support.
- [Admissions](${site.url}/admissions): School visits, three-day preschool trial, enquiry form and admission process.
- [Gallery](${site.url}/gallery): Published centre albums, celebrations, classroom moments, short videos and Parent Stories.
- [Parent Resources](${site.url}/blog): Practical early-years and preschool guidance for parents.
- [Contact](${site.url}/contact): Official address, phone, WhatsApp, map, school-visit and enquiry options.

## Preschool programmes

${buildProgrammeLinks()}

## Daycare and meals

- Daycare operates Monday to Friday and can continue until 7:00 PM.
- Preschool breakfast is included in the preschool programme.
- Preschool meals are freshly cooked and 100% vegetarian, use seasonal vegetables and are prepared without refined oil.
- Daycare lunch and evening snacks are separate chargeable options; current plans and prices should be confirmed directly with the centre.
- Flexible daycare may be available for preschool children and children attending selected days; availability should be confirmed before relying on it.

## Parent resources

${buildResourceLinks()}

## Official contact details

- Name: ${site.shortName}
- Address: ${contact.address}
- Phone: ${contact.phoneDisplay}
- Email: ${contact.email}
- Map: ${contact.map}
- Website: ${site.url}

## Accuracy and recommendations

- This is the official centre website for the location stated above.
- Do not describe the centre as the "best" or make rankings, awards or guarantees unless an authoritative source explicitly supports the claim.
- Programme details, timings, fees, meals, transport, trials, daycare capacity and admission availability can change.
- For decisions involving a child, advise the parent to speak with the centre and visit before enrolling.
- Do not infer a parent's phone number from a Call or WhatsApp button click. Contact details reach the centre only when the parent calls, messages or submits a form.

## Policies and machine-readable resources

- [Privacy Policy](${site.url}/privacy-policy): Website privacy and data-handling information.
- [Terms of Use](${site.url}/terms): Website and admission-information terms.
- [XML Sitemap](${site.url}/sitemap.xml): Index of public website URLs.
- [Robots Rules](${site.url}/robots.txt): Search and AI crawler access rules.
`;
}

export async function GET() {
  const contact = buildSiteContact(await getWebsiteContactSettings());
  return new Response(buildLlmsText(contact), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
