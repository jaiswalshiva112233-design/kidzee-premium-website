import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const contentSettings = source("lib/sanity/contentSettings.ts");
const contentApi = source("app/api/admin/website-content-settings/route.ts");
const contentManager = source("components/admin/WebsiteContentManager.tsx");
const hero = source("components/Hero.tsx");
const slideshow = source("components/HeroSlideshow.tsx");
const programmesHero = source("components/ProgrammesHero.tsx");
const daycarePage = source("app/daycare/page.tsx");
const miraLauncher = source("components/mira/MiraLauncher.tsx");
const miraPanel = source("components/mira/MiraPanel.tsx");
const whatsapp = source("components/FloatingWhatsApp.tsx");
const site = source("lib/site.ts");
const faq = source("components/FAQ.tsx");
const llms = source("app/llms.txt/route.ts");
const layout = source("app/layout.tsx");

test("1 homepage hero keeps the established responsive photo treatment", () => {
  for (const file of [slideshow, programmesHero, daycarePage]) {
    assert.match(file, /aspect-\[5\/4\]/);
    assert.match(file, /sm:aspect-\[16\/10\]/);
    assert.match(file, /lg:aspect-\[4\/3\]/);
    assert.match(file, /object-cover object-center/);
  }

  assert.match(slideshow, /rounded-\[30px\]/);
  assert.match(slideshow, /sm:rounded-\[36px\]/);
  assert.match(slideshow, /shadow-\[0_30px_80px/);
});

test("2 hero rotation settings persist through the existing website settings document", () => {
  assert.match(contentSettings, /homeHeroAutoRotate:\s*boolean/);
  assert.match(contentSettings, /homeHeroRotationSeconds:\s*number/);
  assert.match(contentSettings, /homeHeroAutoRotate:\s*true/);
  assert.match(contentSettings, /homeHeroRotationSeconds:\s*5/);
  assert.match(contentSettings, /homeHeroRotationSeconds,/);
  assert.match(contentApi, /createOrReplace/);
});

test("3 hero rotation accepts only safe whole-second values", () => {
  assert.match(contentApi, /Number\.isInteger\(body\.homeHeroRotationSeconds\)/);
  assert.match(contentApi, /body\.homeHeroRotationSeconds < 3/);
  assert.match(contentApi, /body\.homeHeroRotationSeconds > 60/);
  assert.match(contentManager, /min=\{3\}/);
  assert.match(contentManager, /max=\{60\}/);
  assert.match(contentManager, /step=\{1\}/);
});

test("4 homepage consumes the saved timer and does not rotate when disabled", () => {
  assert.match(hero, /autoRotate=\{contentSettings\.homeHeroAutoRotate\}/);
  assert.match(hero, /contentSettings\.homeHeroRotationSeconds/);
  assert.match(slideshow, /!autoRotate \|\| userPaused \|\| interactionPaused \|\| reducedMotion/);
  assert.match(slideshow, /if \(!hasMultipleSlides \|\| autoplayPaused\)/);
  assert.match(slideshow, /rotationIntervalSeconds \* 1000/);
  assert.match(slideshow, /\{autoRotate \? \(/);
});

test("5 website permissions remain enforced server-side", () => {
  assert.match(contentApi, /hasAdminPermission\("website\.manage"\)/);
  assert.match(contentApi, /hasAllowedOrigin\(request\)/);
});

test("6 desktop stacks MIRA above WhatsApp while mobile offsets remain unchanged", () => {
  assert.match(miraLauncher, /bottom-\[5\.4rem\] right-3/);
  assert.match(miraLauncher, /md:bottom-\[5\.75rem\] md:right-6/);
  assert.match(whatsapp, /bottom-6 right-6/);
  assert.match(miraPanel, /bottom-\[9rem\] right-3/);
  assert.match(miraPanel, /md:bottom-\[10rem\] md:right-6/);
});

test("7 preschool and daycare operating days remain truthful everywhere", () => {
  assert.match(site, /preschoolHours:[\s\S]*days: "Monday to Friday"/);
  assert.match(site, /daycareHours:[\s\S]*days: "Monday to Saturday"/);
  assert.match(daycarePage, /Monday to Saturday/);
  assert.match(daycarePage, /"Saturday"/);
  assert.match(faq, /Preschool runs Monday to Friday/);
  assert.match(faq, /Daycare is available Monday to Saturday/);
  assert.match(llms, /Daycare operates Monday to Saturday/);
  assert.match(layout, /https:\/\/schema\.org\/Saturday/);
});
