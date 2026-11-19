import { ArrowRight, CalendarDays, Gift, HeartHandshake } from "lucide-react";
import Container from "@/components/ui/Container";
import { ADMISSIONS_SESSION, earlyStartOffer } from "@/lib/website/admissionsSession";
import styles from "./WebsiteAdmissionsOffer.module.css";

const icons = [Gift, HeartHandshake, CalendarDays];

export default function WebsiteAdmissionsOffer() {
  return (
    <section id="early-start-offer" aria-labelledby="early-start-heading" className={styles.section}>
      <Container>
        <div className={styles.panel}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Early Start Advantage · {ADMISSIONS_SESSION}</p>
            <h2 id="early-start-heading">{earlyStartOffer.title}</h2>
            <p>{earlyStartOffer.introduction}</p>
          </div>
          <div className={styles.cards}>
            {earlyStartOffer.benefits.map((benefit, index) => {
              const Icon = icons[index];
              return (
                <article key={benefit.title} className={styles.card}>
                  <Icon aria-hidden="true" size={28} />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              );
            })}
          </div>
          <div className={styles.action}>
            <a href="#admission-enquiry">Ask About the Early Start Offer <ArrowRight aria-hidden="true" size={19} /></a>
            <p>Speak to the centre team about your child’s programme, joining date and eligibility.</p>
          </div>
          <details id="offer-terms" className={styles.terms}>
            <summary>Offer details and eligibility</summary>
            <ul>{earlyStartOffer.terms.map((term) => <li key={term}>{term}</li>)}</ul>
          </details>
        </div>
      </Container>
    </section>
  );
}
