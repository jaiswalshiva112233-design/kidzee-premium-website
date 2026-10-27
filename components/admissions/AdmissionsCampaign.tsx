"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Check, Heart, MapPin, Phone, ShieldCheck, Sun, Users, Utensils } from "lucide-react";
import AdmissionForm from "@/components/AdmissionForm";
import { useSiteContact } from "@/components/SiteContactProvider";
import styles from "./AdmissionsCampaign.module.css";
import { admissionsCampaignFaqs } from "@/lib/website/admissionsCampaign";


type AdmissionsCampaignProps = {
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
  initialProgramme = "",
  initialEnquiryType = "SCHOOL_VISIT",
  landingPageId = "",
  landingVariantId = "",
  growthExperimentId = "",
}: AdmissionsCampaignProps) {
  const site = useSiteContact();
  const visitLabel = initialEnquiryType === "SCHOOL_VISIT"
    ? "Request a School Visit"
    : "Send My Enquiry";

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
            <a href="#admission-enquiry" className={styles.button}>Book a School Visit <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <main id="admissions-main">
        <section className={styles.hero} aria-labelledby="admissions-heading">
          <div className={styles.wrap + " " + styles.heroGrid}>
            <div>
              <div className={styles.session}>ADMISSIONS 2027–28 · PLAYGROUP TO SENIOR KG</div>
              <h1 id="admissions-heading" className={styles.title}>
                A happy preschool start in <span>Sector 12, Dwarka.</span>
              </h1>
              <p className={styles.lead}>
                A familiar face at the door. A teacher who knows your child.
                A morning filled with stories, play and little discoveries.
                Come and see how we make the first school years feel at Kidzee.
              </p>
              <p className={styles.offerLabel}>30% off annual charges for 2027–28</p>
              <p className={styles.micro}>
                January enrolments: attend in January and February, with monthly
                tuition starting in March. Summer camp included.
              </p>
              <div className={styles.actions}>
                <a href="#admission-enquiry" className={styles.button}>
                  Book a School Visit <ArrowRight size={17} aria-hidden="true" />
                </a>
                <a href="#january-start" className={styles.button + " " + styles.secondary}>See the January Start Plan</a>
              </div>
              <p className={styles.micro}>Meet the team. See the classrooms. Get the complete fee details.</p>
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
            <div id="ad-enquiry" className={styles.formColumn}>
              <AdmissionForm
                initialProgramme={initialProgramme}
                initialEnquiryType={initialEnquiryType}
                landingPageId={landingPageId}
                landingVariantId={landingVariantId}
                growthExperimentId={growthExperimentId}
                badgeText="LET'S MEET"
                title="Come and see our preschool"
                subtitle="Leave your details and our centre team will call to discuss your child's programme, fees and a convenient visit time."
                submitButtonText={visitLabel}
                privacyText="Our centre team will use your details to respond to this enquiry. Please see our Privacy Policy for more information."
                handoffText="After your enquiry is saved, WhatsApp opens so you can continue the conversation with our team."
              />
              <p className={styles.formNote}>
                <CalendarCheck size={17} aria-hidden="true" />
                Your preferred date is a request. Our team will confirm the visit with you.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.trustStrip} aria-label="At a glance">
          <div className={styles.wrap + " " + styles.trustGrid}>
            <div className={styles.trustItem}><Users size={24} aria-hidden="true" /><div>Small groups<small>1:8 Playgroup &amp; Nursery · 1:10 KG</small></div></div>
            <div className={styles.trustItem}><BookOpen size={24} aria-hidden="true" /><div>Learning through play<small>Kidzee&apos;s Péntemind approach</small></div></div>
            <div className={styles.trustItem}><Utensils size={24} aria-hidden="true" /><div>Preschool breakfast included<small>Freshly cooked vegetarian meals</small></div></div>
            <div className={styles.trustItem}><Heart size={24} aria-hidden="true" /><div>Support beyond preschool<small>Daycare available until 7:00 PM</small></div></div>
          </div>
        </section>

        <section id="january-start" className={styles.section + " " + styles.soft} style={{ scrollMarginTop: 100 }}>
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>A little time to feel at home</p>
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
                <p>For January 2027 enrolments, your child joins the routine and activities with no monthly tuition charge for these two months. Monthly tuition starts in March 2027.</p>
              </article>
              <article className={styles.offerCell}>
                <Sun size={27} className={styles.offerIcon} aria-hidden="true" />
                <h3 className={styles.offerLabel}>Summer camp included</h3>
                <p>Children enrolled for 2027–28 pay no additional summer camp fee.</p>
              </article>
            </div>
            <div className={styles.timeline}>
              <div><strong>At enrolment</strong><span>Annual charges after concession, kit and other applicable admission charges.</span></div>
              <div><strong>From March 2027</strong><span>Monthly preschool tuition begins with the academic session.</span></div>
            </div>
            <a href="#offer-terms" className={styles.termsLink}>Read the offer details and fee terms</a>
          </div>
        </section>

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
              <div><p className={styles.eyebrow}>Inside Kidzee Sector 12B</p><h2 className={styles.heading}>A closer look at where<br />the little discoveries happen.</h2></div>
              <a href="#admission-enquiry" className={styles.button + " " + styles.secondary}>See It in Person <ArrowRight size={16} aria-hidden="true" /></a>
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
            <h2 className={styles.heading}>Find the right starting point.</h2>
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
              <div><p className={styles.eyebrow}>From families at our centre</p><h2 className={styles.heading}>Parents notice the everyday things.</h2></div>
              <a href={site.googleReviews} target="_blank" rel="noopener noreferrer" className={styles.termsLink}>Read current Google reviews <ArrowRight size={14} aria-hidden="true" /></a>
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
            <Link href="/gallery#parent-stories" className={styles.termsLink}>Explore parent stories and centre albums</Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap + " " + styles.visit}>
            <div>
              <p className={styles.eyebrow}>Your first visit</p>
              <h2 className={styles.heading}>Bring your questions.<br />Bring your child.</h2>
              <p className={styles.intro}>You don&apos;t have to decide on the first visit. We&apos;ll walk you through the spaces, explain the routine and help you picture your child&apos;s day here.</p>
              <ul className={styles.visitList}>
                {["Meet the centre team and see the classrooms.", "Discuss your child's age, routine and settling needs.", "Understand the offer and receive a complete fee breakup."].map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}
              </ul>
              <a href="#admission-enquiry" className={styles.button}>Arrange My School Visit <ArrowRight size={17} aria-hidden="true" /></a>
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
                <li>The 30% concession is on annual charges for 2027–28 preschool admissions at this centre. It does not mean 30% off the total fee package or monthly tuition.</li>
                <li>For January 2027 enrolments, children attend during January and February without monthly tuition for those months. Monthly tuition starts from March 2027 with the academic session. Attendance follows the centre&apos;s working days and agreed programme routine.</li>
                <li>Annual charges after the concession, kit and other applicable admission charges remain payable at enrolment. The complete fee breakup will be shared before payment.</li>
                <li>Summer camp is included for children enrolled in our 2027–28 preschool programme, with no additional summer camp fee. Dates and timings will follow the centre&apos;s camp schedule.</li>
                <li>Daycare, optional daycare meals and preschool transport are separate services with their own charges. Programme placement and seat availability are confirmed by the centre.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <div className={styles.wrap + " " + styles.closingInner}>
            <div><h2 className={styles.heading}>Come and get a feel for your child&apos;s first school.</h2><p>Meet us at Kidzee Sector 12B, Dwarka. We&apos;ll take it from there, together.</p></div>
            <a href="#admission-enquiry" className={styles.button + " " + styles.yellow}>Book a School Visit <ArrowRight size={17} aria-hidden="true" /></a>
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
      <nav className={styles.mobileBar} aria-label="Contact admissions">
        <a href={"tel:" + site.phone} className={styles.button + " " + styles.secondary}><Phone size={17} aria-hidden="true" />Call</a>
        <a href="#admission-enquiry" className={styles.button}><CalendarCheck size={17} aria-hidden="true" />Book a School Visit</a>
      </nav>
    </div>
  );
}
