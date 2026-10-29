"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { WebsiteTeamMember } from "@/lib/sanity/team";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Check, Heart, MapPin, MessageCircle, Phone, Play, ShieldCheck, Sun, Users, Utensils } from "lucide-react";
import AdmissionForm from "@/components/AdmissionForm";
import { useSiteContact } from "@/components/SiteContactProvider";
import styles from "./AdmissionsCampaign.module.css";
import { admissionsCampaignFaqs, campaignPortraitUrl } from "@/lib/website/admissionsCampaign";


type AdmissionsCampaignProps = {
  teamMembers?: WebsiteTeamMember[];
  initialProgramme?: string;
  initialEnquiryType?: string;
  landingPageId?: string;
  landingVariantId?: string;
  growthExperimentId?: string;
};

const programmes = [
  { name: "Playgroup", age: "2–3 years", description: "Feeling comfortable with teachers, friends and a new routine." },
  { name: "Nursery", age: "3–4 years", description: "Building language, independence and early concepts through play." },
  { name: "Junior KG", age: "4–5 years", description: "Growing confidence with early reading, writing and numbers." },
  { name: "Senior KG", age: "5–6 years", description: "Strengthening skills and independence for primary school." },
] as const;

const parentReviews = [
  {
    name: "Shailja Singh",
    quote: "I am fully satisfied with the school in every manner—learning, communication and safety. All the teachers treat children very nicely, and my daughter is growing here.",
  },
  {
    name: "Komal Gahlot",
    quote: "The preschool is trustworthy. The teachers share weekly feedback and regularly update parents about activities.",
  },
] as const;

export default function AdmissionsCampaign({
  teamMembers = [],
  initialProgramme = "",
  initialEnquiryType = "SCHOOL_VISIT",
  landingPageId = "",
  landingVariantId = "",
  growthExperimentId = "",
}: AdmissionsCampaignProps) {
  const site = useSiteContact();
  const [enquiryIntent, setEnquiryIntent] = useState(initialEnquiryType === "FEES" ? "CALLBACK" : initialEnquiryType);
  const [programmeInterest, setProgrammeInterest] = useState(initialEnquiryType === "DAYCARE" ? "DAYCARE" : initialProgramme);
  const isDaycare = programmeInterest === "DAYCARE" || enquiryIntent === "DAYCARE";
  function chooseService(daycare: boolean) {
    setProgrammeInterest(daycare ? "DAYCARE" : programmeInterest === "DAYCARE" ? "" : programmeInterest);
    setEnquiryIntent(daycare ? "DAYCARE" : "SCHOOL_VISIT");
  }
  function changeProgramme(value: string) {
    setProgrammeInterest(value);
    if (value === "DAYCARE") setEnquiryIntent("DAYCARE");
    else if (enquiryIntent === "DAYCARE") setEnquiryIntent("SCHOOL_VISIT");
  }
  const [formFocused, setFormFocused] = useState(false);
  const [showParentVideo, setShowParentVideo] = useState(false);
  const parentVideoRef = useRef<HTMLVideoElement>(null);

  function playParentStory() {
    const video = parentVideoRef.current;
    if (!video) return;
    // Start the media request within the parent\'s click, preserving browser
    // user activation instead of relying on unmuted autoplay after rendering.
    video.src = "/videos/parent-reviews-dwarka-sec12.mp4";
    setShowParentVideo(true);
    void video.play().catch(() => { /* Native controls remain available. */ });
  }


  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#admissions-main">Skip to main content</a>
      <header className={styles.header}>
        <div className={styles.wrap + " " + styles.headerInner}>
          <Link href="/" className={styles.identity} aria-label="Kidzee Sector 12 Dwarka home">
            <Image src="/images/kidzee-logo.png" alt="Kidzee" width={146} height={72} className={styles.logo} />
            <span className={styles.centre}>Sector 12B<br />Dwarka, New Delhi</span>
          </Link>
          <div className={styles.headerActions}>
            <a href={"tel:" + site.phone} className={styles.phone}>
              <Phone size={17} aria-hidden="true" /><span>{site.phoneDisplay}</span>
            </a>
            <a href="#admission-enquiry" onClick={() => setEnquiryIntent("SCHOOL_VISIT")} className={styles.button}>Book a School Visit <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <main id="admissions-main">
        <section className={styles.hero} aria-labelledby="admissions-heading">
          <div className={styles.wrap + " " + styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.session}>PRESCHOOL ADMISSIONS 2027–28</div>
              <div className={styles.services} role="group" aria-label="Choose preschool or daycare">
                <button type="button" aria-pressed={!isDaycare} onClick={() => chooseService(false)}>Preschool</button>
                <button type="button" aria-pressed={isDaycare} onClick={() => chooseService(true)}>Daycare · 12:30 PM onwards</button>
              </div>
              <h1 id="admissions-heading" className={styles.title}>
                {isDaycare ? "Daycare in " : "Preschool Admissions in "}<span>Dwarka Sector 12.</span>
              </h1>
              <p className={styles.lead}>
                {isDaycare ? "A familiar place for rest, play and an unhurried afternoon. Monday to Saturday, 12:30 PM–7:00 PM." : "Kidzee play school in Sector 12B. Playgroup, Nursery & KG for ages 2–6, with learning through play."}
              </p>
              <ul className={styles.heroBenefits} aria-label={isDaycare ? "Daycare benefits" : "Preschool benefits"}>
                <li><Check size={16} aria-hidden="true" /><span>{isDaycare ? "After-preschool, selected-day & occasional care" : "1:8 teacher–child ratio in Playgroup & Nursery"}</span></li>
                <li><Check size={16} aria-hidden="true" /><span>{isDaycare ? "Quiet time, activities & homework support" : "Vegetarian preschool breakfast included"}</span></li>
              </ul>
              <div className={styles.heroOffer}>
                {isDaycare ? <><strong>Daycare from 12:30 PM to 7:00 PM</strong><span>Tell us your preferred days and pickup time.</span><small><a href="#daycare">Explore our daycare routine</a></small></> : <><strong>30% Off Annual Charges</strong><span>January settling-in · Tuition Begins in March</span><small>Summer Camp Included · <a href="#offer-terms">Preschool offer terms</a></small></>}
              </div>

            </div>
            <div id="ad-enquiry" className={styles.formColumn} onFocusCapture={() => setFormFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFormFocused(false); }}>
              <AdmissionForm
                compact
                campaignIntent
                programme={programmeInterest}
                onProgrammeChange={changeProgramme}
                enquiryType={enquiryIntent}
                onEnquiryTypeChange={setEnquiryIntent}
                autoOpenWhatsApp={false}
                initialProgramme={initialProgramme}
                initialEnquiryType={initialEnquiryType}
                landingPageId={landingPageId}
                landingVariantId={landingVariantId}
                growthExperimentId={growthExperimentId}
                badgeText="ADMISSIONS 2027–28"
                title="Book a School Visit"
                privacyText="Your details go directly to our centre team to arrange your visit or answer your questions."
                handoffText="We will contact you to discuss your enquiry. Continuing on WhatsApp after submitting is optional."
              />
              <figure className={styles.earlyReview}>
                <blockquote>“The teachers share weekly feedback and regularly update parents about activities.”</blockquote>
                <figcaption>Komal Gahlot · Google review excerpt<br /><a href={site.googleReviews} target="_blank" rel="noopener noreferrer">Read current reviews</a></figcaption>
              </figure>
            </div>
            <figure className={styles.heroPhoto}>
                <Image
                  src="/images/landing/kidzee-creative-learning.jpg"
                  alt="Children taking part in a creative classroom activity at Kidzee Sector 12 Dwarka"
                  width={1200}
                  height={675}
                  sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1200px) 52vw, 620px"
                  preload
                />
                <figcaption className={styles.photoNote}>A real moment at our Sector 12B centre</figcaption>
              </figure>
          </div>
        </section>

        <section className={styles.trustStrip} aria-label="At a glance">
          <div className={styles.wrap + " " + styles.trustGrid}>
            <div className={styles.trustItem}><Users size={24} aria-hidden="true" /><div>Small groups<small>1:8 Playgroup &amp; Nursery · 1:10 KG</small></div></div>
            <div className={styles.trustItem}><BookOpen size={24} aria-hidden="true" /><div>Learning through play<small>Kidzee&apos;s Péntemind approach</small></div></div>
            <div className={styles.trustItem}><Utensils size={24} aria-hidden="true" /><div>Preschool breakfast included<small>Freshly cooked vegetarian meals</small></div></div>
            <div className={styles.trustItem}><Heart size={24} aria-hidden="true" /><div>Support beyond preschool<small>Daycare · 12:30 PM–7:00 PM</small></div></div>
          </div>
        </section>

        <section id="daycare" className={styles.section} aria-labelledby="daycare-heading">
          <div className={styles.wrap + " " + styles.daycareGrid}>
            <div>
              <p className={styles.eyebrow}>Afternoons at Kidzee Sector 12B</p>
              <h2 id="daycare-heading" className={styles.heading}>Daycare in Dwarka Sector 12.<br />From 12:30 PM to 7:00 PM.</h2>
              <p className={styles.intro}>Monday to Saturday. Continue after preschool, join after another school, or ask about selected-day and occasional care. Our team confirms a routine suited to your child and current availability.</p>
              <ul className={styles.visitList}>
                <li><Check size={18} aria-hidden="true" />Rest or quiet time, stories, art and supervised play.</li>
                <li><Check size={18} aria-hidden="true" />Homework support for school-going children.</li>
                <li><Check size={18} aria-hidden="true" />Discuss lunch, evening snacks and authorised pickup with our team.</li>
              </ul>
              <a href="#admission-enquiry" onClick={() => chooseService(true)} className={styles.button}>Enquire About Daycare <ArrowRight size={17} aria-hidden="true" /></a>
              <p className={styles.micro}>Daycare transport is not available. Contact admissions to discuss programme details.</p>
            </div>
            <figure className={styles.daycarePhoto}><Image src="/images/daycare/daycare-main.jpg" alt="A child working on an activity during daycare at Kidzee Sector 12 Dwarka" width={720} height={1280} sizes="(max-width: 767px) calc(100vw - 32px), 400px" /><figcaption>A real daycare moment at our centre</figcaption></figure>
          </div>
        </section>

        <section id="january-start" className={styles.section + " " + styles.soft} style={{ scrollMarginTop: 100 }}>
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>Preschool · Early Start Advantage</p>
            <h2 className={styles.heading}>Start in January. Settle in with us.<br />Begin the academic session in March.</h2>
            <p className={styles.intro}>
              The first few weeks matter. For children joining in January 2027,
              January and February offer time to get to know the teachers, make
              friends and join the preschool day before the academic session begins.
            </p>
            <div className={styles.offer}>
              <article className={styles.offerCell}>
                <p className={styles.offerNumber}>30%</p>
                <p className={styles.offerLabel}>off annual charges</p>
                <p>For preschool admissions to the 2027–28 session.</p>
              </article>
              <article className={styles.offerCell}>
                <Heart size={27} className={styles.offerIcon} aria-hidden="true" />
                <h3 className={styles.offerLabel}>January &amp; February attendance</h3>
                <p>A gentle beginning for eligible January 2027 starters, with time to get to know the teachers and preschool routine. Tuition Begins in March.</p>
              </article>
              <article className={styles.offerCell}>
                <Sun size={27} className={styles.offerIcon} aria-hidden="true" />
                <h3 className={styles.offerLabel}>Summer camp included</h3>
                <p>Summer Camp Included for eligible 2027–28 preschool enrolments. The centre will share the schedule.</p>
              </article>
            </div>
            <div className={styles.timeline}>
              <div><strong>Before joining</strong><span>Meet the team, discuss readiness and confirm your child's programme.</span></div>
              <div><strong>Tuition Begins in March</strong><span>The 2027–28 academic session begins in March 2027.</span></div>
            </div>
            <a href="#offer-terms" className={styles.termsLink}>Read preschool offer terms</a>
          </div>
        </section>

        {teamMembers.length > 0 ? (
          <section className={styles.section} aria-labelledby="admissions-team-heading">
            <div className={styles.wrap + " " + styles.teamGrid}>
              <div>
                <p className={styles.eyebrow}>Meet the people behind the care</p>
                <h2 id="admissions-team-heading" className={styles.heading}>A familiar face.<br />A conversation that matters.</h2>
                <p className={styles.intro}>Meet our centre team, share what your child needs and ask how we support the first days of preschool.</p>
                <Link href="/about#team" className={styles.termsLink}>Get to know our team <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <div className={styles.teamCards}>
                {[...teamMembers].sort((a, b) => Number(/director|head|principal/i.test(b.role)) - Number(/director|head|principal/i.test(a.role))).slice(0, 2).map((member) => (
                  <article key={member._id} className={styles.teamCard}>
                    {member.imageUrl ? <Image src={campaignPortraitUrl(member.imageUrl)} alt={member.photoAlt || member.name} width={360} height={400} sizes="(max-width: 767px) 44vw, 240px" /> : null}
                    <div><h3>{member.name}</h3><p>{member.role}</p>{member.qualification ? <small>{member.qualification}</small> : null}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>What matters in your child&apos;s day</p>
            <h2 className={styles.heading}>Care you can ask about.<br />Learning you can come and see.</h2>
            <div className={styles.values}>
              <article className={styles.value}>
                <Heart size={27} aria-hidden="true" />
                <h3>Help with the small, big steps</h3>
                <p>Joining a group, asking for help or saying goodbye in the morning—our teachers work with parents as children become comfortable with school.</p>
              </article>
              <article className={styles.value}>
                <BookOpen size={27} aria-hidden="true" />
                <h3>More than worksheets</h3>
                <p>Stories, movement, art, conversation and hands-on activities help children practise language, early concepts and everyday independence.</p>
              </article>
              <article className={styles.value}>
                <ShieldCheck size={27} aria-hidden="true" />
                <h3>A team you can talk to</h3>
                <p>Meet the people who will care for your child. Ask about supervision, authorised handover, classroom routines and how we keep you informed.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.soft}>
          <div className={styles.wrap}>
            <div className={styles.sectionTop}>
              <div><p className={styles.eyebrow}>Inside Kidzee Sector 12B</p><h2 id="centre-photos" style={{scrollMarginTop:100}} className={styles.heading}>A closer look at where<br />the little discoveries happen.</h2></div>
              <a href="#admission-enquiry" onClick={() => setEnquiryIntent("SCHOOL_VISIT")} className={styles.button + " " + styles.secondary}>See It in Person <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className={styles.gallery}>
              <figure><Image src="/images/landing/kidzee-modern-classroom.jpg" alt="Activity classroom at Kidzee Sector 12 Dwarka" width={900} height={675} sizes="(max-width: 767px) 100vw, 40vw" /><figcaption>Space to learn and create</figcaption></figure>
              <figure><Image src="/images/landing/kidzee-indoor-turf-arena.jpg" alt="Indoor turf play area at Kidzee Sector 12 Dwarka" width={900} height={675} sizes="(max-width: 767px) 50vw, 30vw" /><figcaption>Room to move and play</figcaption></figure>
              <figure><Image src="/images/landing/kidzee-sensory-ball-pool.jpg" alt="Soft ball-pool play area at Kidzee Sector 12 Dwarka" width={900} height={675} sizes="(max-width: 767px) 50vw, 30vw" /><figcaption>Play that invites exploration</figcaption></figure>
            </div>
            <p className={styles.reviewNote}>Photographs from our centre. Visit to see the current classroom and play arrangements.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>From a first hello to school readiness</p>
            <h2 id="programmes" style={{scrollMarginTop:100}} className={styles.heading}>Playgroup, Nursery &amp; KG Admissions in Dwarka</h2>
            <p className={styles.intro}>Tell us your child&apos;s age and current routine. We&apos;ll help you understand the suitable programme.</p>
            <div className={styles.programmes}>
              {programmes.map((programme) => (
                <article key={programme.name} className={styles.programme}>
                  <small>{programme.age}</small><strong>{programme.name}</strong><p>{programme.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.soft}>
          <div className={styles.wrap}>
            <div className={styles.sectionTop}>
              <div id="reviews" style={{scrollMarginTop:100}}><p className={styles.eyebrow}>From families at our centre</p><h2 className={styles.heading}>Parents notice the everyday things.</h2></div>
              <a href={site.googleReviews} target="_blank" rel="noopener noreferrer" className={styles.termsLink}>Read current Google reviews <ArrowRight size={14} aria-hidden="true" /></a>
            </div>
            <div className={styles.parentStory}>
              <div>
                <h3>Hear from a family at our centre</h3>
                <p>A parent shares their experience of Kidzee Sector 12, Dwarka. Play the video when you are ready.</p>
                <Link href="/about#team" className={styles.termsLink}>Meet our centre team <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <div>
                <video ref={parentVideoRef} hidden={!showParentVideo} className={styles.parentVideo} controls playsInline preload="none" data-analytics-name="admissions_parent_story" aria-label="Parent experience at Kidzee Sector 12 Dwarka" />
                {!showParentVideo ? (
                  <button type="button" className={styles.videoButton} onClick={playParentStory}>
                    <span><Play size={23} fill="currentColor" aria-hidden="true" /></span>
                    <strong>Watch a parent story</strong>
                    <small>Plays with sound after you choose to watch</small>
                  </button>
                ) : null}
              </div>
            </div>
            <div className={styles.quotes}>
              {parentReviews.map((review) => (
                <figure className={styles.quote} key={review.name}>
                  <blockquote>“{review.quote}”</blockquote>
                  <figcaption>{review.name}<span>Google review excerpt</span></figcaption>
                </figure>
              ))}
            </div>
            <p className={styles.reviewNote}>These excerpts also appear on our main website and are shortened for readability. Open Google reviews to read the original context.</p>
            <Link href="/gallery" className={styles.termsLink}>Explore parent stories and centre albums</Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap + " " + styles.visit}>
            <div>
              <p className={styles.eyebrow}>Your first visit</p>
              <h2 className={styles.heading}>Bring your questions.<br />Bring your child.</h2>
              <p className={styles.intro}>You don&apos;t have to decide on the first visit. We&apos;ll walk you through the spaces, explain the routine and help you picture your child&apos;s day here.</p>
              <ul className={styles.visitList}>
                {["Meet the centre team and see the classrooms.", "Discuss your child's age, routine and settling needs.", "Discuss the programme, settling-in and approved offer terms."].map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}
              </ul>
              <a href="#admission-enquiry" onClick={() => setEnquiryIntent("SCHOOL_VISIT")} className={styles.button}>Arrange My School Visit <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
            <aside className={styles.address}>
              <MapPin size={27} aria-hidden="true" />
              <h3>Kidzee Sector 12, Dwarka</h3>
              <p>{site.address}</p>
              <p>Visits by appointment. Call our team for a convenient time.</p>
              <a href={"tel:" + site.phone}>{site.phoneDisplay}</a><br />
              <a href={site.map} target="_blank" rel="noopener noreferrer" className={styles.button + " " + styles.secondary}>Get Directions <ArrowRight size={16} aria-hidden="true" /></a>
            </aside>
          </div>
        </section>

        <section className={styles.section + " " + styles.soft}>
          <div className={styles.wrap}>
            <div className={styles.faqGrid}>
              <div><p className={styles.eyebrow}>A few practical questions</p><h2 className={styles.heading}>Clear answers before you visit.</h2><p className={styles.intro}>Call us if you would rather talk it through. We&apos;ll explain what applies to your child.</p></div>
              <div>{admissionsCampaignFaqs.map((faq) => <details className={styles.faq} key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
            </div>
            <div id="offer-terms" className={styles.terms}>
              <h3>Admissions 2027–28 · Offer details</h3>
              <ul>
                <li>30% Off Annual Charges applies to eligible 2027–28 preschool admissions at this centre. Contact the admissions team to discuss the approved terms.</li>
                <li>January and February are a settling-in attendance period for eligible children joining in January 2027, including families completing admission in December 2026. Tuition Begins in March. Attendance follows the centre&apos;s working days and agreed routine.</li>
                <li>Summer Camp Included for eligible 2027–28 preschool enrolments. Dates and timings follow the centre&apos;s camp schedule.</li>
                <li>These preschool benefits do not describe a daycare offer. Discuss daycare, meals, transport arrangements, placement and availability directly with the admissions team before enrolling.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <div className={styles.wrap + " " + styles.closingInner}>
            <div><h2 className={styles.heading}>Come and get a feel for your child&apos;s first school.</h2><p>Meet us at Kidzee Sector 12B, Dwarka. We&apos;ll take it from there, together.</p></div>
            <a href="#admission-enquiry" onClick={() => setEnquiryIntent("SCHOOL_VISIT")} className={styles.button + " " + styles.yellow}>Book a School Visit <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap + " " + styles.footerInner}>
          <div><strong>Kidzee Sector 12, Dwarka</strong><br />Admissions 2027–28 · {site.addressShort}</div>
          <nav className={styles.footerLinks} aria-label="Useful links">
            <Link href="/">Our Website</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link>
          </nav>
        </div>
      </footer>
      <nav className={styles.mobileBar} aria-label="Contact admissions" hidden={formFocused}>
        <a href={"tel:" + site.phone} className={styles.button + " " + styles.secondary}><Phone size={17} aria-hidden="true" />Call</a>
        <a href={isDaycare ? site.whatsappDaycare : site.whatsappAdmission} target="_blank" rel="noopener noreferrer" className={styles.button + " " + styles.secondary}><MessageCircle size={17} aria-hidden="true" />WhatsApp</a>
        <a href="#admission-enquiry" onClick={() => setEnquiryIntent("SCHOOL_VISIT")} className={styles.button}><CalendarCheck size={17} aria-hidden="true" />Book Visit</a>
      </nav>
    </div>
  );
}

