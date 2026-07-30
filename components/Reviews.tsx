import { ArrowRight, MessageCircle, Quote, Star } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const reviews = [
  {
    text: "The teachers are attentive and communicate regularly with us. We have seen a positive change in our child’s confidence and willingness to participate.",
    parent: "Parent of a preschool child",
  },
  {
    text: "Our child settled into the school routine comfortably. The teachers were patient during the initial days and kept us informed about how the day was going.",
    parent: "Parent of a Playgroup child",
  },
  {
    text: "We appreciate the personal attention, classroom activities and the way the team responds whenever we have a question about our child.",
    parent: "Parent of a Nursery child",
  },
] as const;

function Stars() {
  return (
    <div
      className="flex items-center gap-1"
      aria-label="Five-star parent review"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          size={17}
          className="fill-[#F6C84B] text-[#D7A818]"
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section
      aria-labelledby="reviews-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-12 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7A459C]">
              Parent experiences
            </p>

            <h2
              id="reviews-heading"
              className="mt-4 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              What parents value about our centre.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Families often mention teacher support, regular communication
              and the way children gradually become comfortable with the
              school routine.
            </p>
          </div>

          <Button
            href={site.googleReviews}
            external
            variant="secondary"
            size="md"
            rightIcon={<ArrowRight size={18} />}
            className="w-fit"
          >
            Read Google Reviews
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.text}
              className="relative flex h-full flex-col rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_44px_rgba(52,20,68,0.06)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <Stars />

                <Quote
                  aria-hidden="true"
                  size={31}
                  className="shrink-0 fill-[#F3EAF8] text-[#CBAFDC]"
                />
              </div>

              <blockquote className="mt-6 flex-1">
                <p className="text-[16px] leading-8 text-[#514654]">
                  “{review.text}”
                </p>
              </blockquote>

              <div className="mt-7 border-t border-[#5B2A86]/10 pt-5">
                <p className="text-sm font-black text-[#2D1736]">
                  {review.parent}
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.11em] text-[#8A7D8E]">
                  Google review
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-[30px] bg-[#281034] px-6 py-8 text-center text-white shadow-[0_22px_60px_rgba(40,16,52,0.18)] sm:px-8 lg:flex-row lg:px-10 lg:py-9 lg:text-left">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Visit the centre before making your decision.
            </h3>

            <p className="mt-3 leading-7 text-white/75">
              Meet the teachers, see the classrooms and ask questions about
              your child’s programme and daily routine.
            </p>
          </div>

          <Button
            href={site.whatsappVisit}
            external
            variant="yellow"
            size="lg"
            leftIcon={<MessageCircle size={18} />}
            className="shrink-0"
          >
            Book a Visit
          </Button>
        </div>
      </Container>
    </section>
  );
}