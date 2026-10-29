# Admissions and daycare campaign review

## Scope and destination
The established Google Ads destination remains /landing/preschool-admissions-dwarka-sector-12. The public /admissions route uses the same campaign component and enquiry integration. Neither route is redirected. Both accept validated programme/enquiry query presets so a daycare ad can use the established path with ?programme=DAYCARE&enquiry=DAYCARE. No new thin page is created. Existing published-record availability remains authoritative for the ads route.

## Public content restriction
No fee amounts, price tables, admission-charge explanations, comparisons or fee download promises are displayed. The approved preschool messages remain 30% Off Annual Charges, Tuition Begins in March and Summer Camp Included. December 2026 admissions for January 2027 starts retain eligibility. Offer terms explain preschool eligibility and direct families to admissions, without publishing pricing. The campaign chat launcher is omitted so a general assistant cannot reintroduce prices. Other website pages are outside this change.

## Daycare
The owner confirmed the 12:30 PM start. The established daycare page and configuration confirm 12:30 PM–7:00 PM, Monday to Saturday, after-school/after-preschool, occasional and selected-day care, quiet time, activities and homework support. Meals and pickup arrangements are discussed directly with the team. Daycare transport is not available. Preschool offers are not represented as daycare offers.

## Parent and tracking flow
A preschool/daycare choice keeps one form on the page. Switching service or enquiry intent preserves parent details. Programme and enquiry type are saved through the existing CentreOS endpoint. Visit requests retain daycare programme interest. Legacy enquiry=FEES links open the admissions callback choice. Successful submissions retain their reference and optional WhatsApp continuation; submissionId and enquiry-reference deduplication are unchanged. Direct WhatsApp links remain click signals, not verified enquiries.

## Rendering and experiment controls
The exact ads route renders AdmissionsCampaign directly rather than serializing unused legacy managed-page content and variants into the public response. This also avoids loading the legacy landing renderer for this campaign. Page-level attribution remains. No obsolete legacy variant or experiment labels are emitted for this fixed template. Other managed pages preserve their content and experiment behavior.

## Verification and approval
Production build, regression and browser checks are required. Browser checks use an isolated database and synthetic parent details. They cover no public pricing in body/metadata/JSON-LD, no legacy-content serialization, mobile placement, both route presets, daycare saves, retry deduplication, service switching, direct WhatsApp links and optional parent video. Live provider receipts and alert delivery remain separate checks. This revision is prepared for owner approval; do not merge, publish or activate advertising before approval.

## Visual pricing review
The previous turf photo contains a visible promotional price poster, so this campaign uses the existing genuine indoor-turf WebP photograph without that poster. The unreviewed testimonial video is not embedded until its full audio and on-screen content have been checked against the no-pricing restriction. Genuine approved text reviews remain. Main-site media is unchanged.

