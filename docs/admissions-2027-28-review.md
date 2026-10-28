# Admissions 2027–28 campaign review

## Owner-confirmed offer
Families completing admission in December 2026 for a January 2027 start qualify for January–February preschool attendance without monthly tuition. Monthly tuition starts in March 2027. Annual charges after the 30% concession, kit and other applicable admission charges remain payable at enrolment. Summer camp has no additional camp fee. Optional daycare, daycare meals and preschool transport remain separate.

## Template and experiment controls
The exact campaign slug preschool-admissions-dwarka-sector-12 and /admissions use the reviewed code-managed AdmissionsCampaign template. Content, photographs, offers and terms for these pages are maintained in that component and lib/website/admissionsCampaign.ts. The published managed-page record still controls whether the campaign URL is available.

Legacy page-content edits, saved versions and A/B variants describe the previous template and do not control the fixed campaign layout. For this slug the new template deliberately sends no legacy variant/experiment ID or LANDING_VARIANT_VIEW event. Page-level attribution, enquiry IDs, consent, click identifiers and conversion deduplication remain active. Configure a campaign-compatible content/variant renderer and review it before starting new experiments for this URL. Other managed landing pages keep their existing content and A/B behavior.

Published team profiles are read from the existing website team settings; no names, photos, qualifications or ratings are invented. If no published profiles are available, their photo section is omitted and the existing About/team link remains.

## Parent flow
The first step asks for parent name and phone. A visible school-visit / fees-and-availability selector preserves entered details when parents switch. Programme, child name and visit date are optional and sit inside a disclosure. Visit CTAs restore school-visit intent without remounting the form. The fees request is followed up by the centre; it does not promise an immediate fee download. Additional details remain in a disclosure. A saved enquiry shows its reference and an optional WhatsApp continuation. The continuation carries the same reference and is excluded from independent WhatsApp click conversions. The existing server submissionId retry protection is unchanged.

## Release checks
The owner approved the campaign page and requested these further improvements after comparison with the Footprints paid landing page. Before the December 15, 2026 restart, update the outdated 2026–27 ad headline and review daycare keyword/ad destination matching separately. Verify current Google rating/review count before displaying a numerical badge. Do not invent fee amounts; share the approved complete fee breakup with families.

The automated browser checks use an isolated database and synthetic details. They do not confirm live enquiry notification delivery, production tag receipts, call forwarding, or real-user speed. Verify these after an approved release with an explicitly identified test enquiry.

## Mobile and message-match refinement
The hero identifies preschool admissions in Dwarka Sector 12, Kidzee play school, Playgroup, Nursery and KG, with the confirmed offer and ages 2–6. The short mobile opening is followed by the form before the centre photograph; desktop keeps the real image beside the enquiry. No numerical rating, invented fee, unverifiable safety feature or ranking guarantee is added. October 28 account diagnostics showed generic preschool keywords with below-average landing-page experience; these are historical diagnostics, not a measurement of the new release. Daycare-specific campaigns and outdated ad copy still need a separate pre-restart review.

