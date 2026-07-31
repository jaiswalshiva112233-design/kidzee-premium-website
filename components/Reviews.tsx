import {
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Quote,
  ShieldCheck,
  Star,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const featuredReview = {
  text: "It is the best preschool, I would say. I am fully satisfied with the school in every manner—learning, communication and safety. All the teachers treat children very nicely, and my daughter is growing here. It was our best decision for her.",
  parent: "Shailja Singh",
  rating: 5,
  highlight: "Learning, safety and caring teachers",
};

const reviews = [
  {
    text: "My daughter has become more confident and social. The campus is safe and clean, and the teachers and didi take very good care of the children.",
    parent: "Thakur Sapna",
    rating: 4,
    highlight: "Confidence and personal care",
  },
  {
    text: "The preschool is trustworthy, and parents can send their children without worrying. The teachers share weekly feedback and regularly update parents about activities.",
    parent: "Komal Gahlot",
    rating: 5,
    highlight: "Trust and regular communication",
  },
  {
    text: "Children learn through the play-way method. The environment is clean, the staff are friendly, and I am very happy to send my child to this school.",
    parent: "Ritu Singh",
    rating: 5,
    highlight: "Play-way learning",
  },
  {
    text: "The Mother's Day celebration was memorable for both me and my daughter. Every activity was thoughtfully organised, and we both enjoyed the entire event.",
    parent: "Pinky Badola",
    rating: 5,
    highlight: "Memorable parent events",
  },
] as const;

const trustPoints = [
  "Real feedback from parents",
  "Publicly available Google reviews",
  "Experiences from families at our centre",
] as const;

function Stars({
  rating = 5,
  size = 17,
}: {
  rating?: number;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < rating;

        return (
          <Star
            key={index}
            aria-hidden="true"
            size={size}
            className={
              filled
                ? "fill-[#F6C84B] text-[#D7A818]"
                : "fill-[#E7E0E9] text-[#D5CBD9]"
            }
          />
        );
      })}
    </div>
  );
}

export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative isolate overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-44 top-12 h-96 w-96 rounded-full bg-[#EADDF1]/85 blur-3xl" />
        <div className="absolute -right-40 bottom-12 h-96 w-96 rounded-full bg-[#F6C84B]/18 blur-3xl" />
        <div className="absolute left-[42%] top-[44%] h-72 w-72 rounded-full bg-[#5B2A86]/[0.04] blur-3xl" />
      </div>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.05)]">
              <Star
                aria-hidden="true"
                size={15}
                className="fill-[#F6C84B] text-[#D7A818]"
              />
              Parent reviews
            </div>

            <h2
              id="reviews-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[48px]"
            >
              What parents say after becoming part of our Kidzee family.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Families often appreciate the caring teachers, safe environment,
              regular communication and positive changes they see in their
              children.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_18px_50px_rgba(52,20,68,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Stars rating={5} size={19} />

                <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
                  4.8
                  <span className="ml-1 text-lg text-[#7C7080]">/5</span>
                </p>

                <p className="mt-1 text-sm font-bold text-[#6F6474]">
                  Google rating
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <ShieldCheck aria-hidden="true" size={27} />
              </div>
            </div>

            <Button
              href={site.googleReviews}
              external
              variant="secondary"
              size="md"
              rightIcon={<ExternalLink aria-hidden="true" size={16} />}
              className="mt-5 w-full"
              aria-label="Read Google reviews for Kidzee Sector 12 Dwarka"
            >
              Read Google Reviews
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {trustPoints.map((point, index) => (
            <div
              key={point}
              className="flex items-center gap-3 rounded-2xl border border-[#5B2A86]/10 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(52,20,68,0.045)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-sm font-black text-[#5B2A86]">
                {index + 1}
              </span>

              <p className="text-sm font-bold leading-6 text-[#493B4F]">
                {point}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="relative isolate overflow-hidden rounded-[32px] bg-[#2D1736] p-7 text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)] sm:p-9 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-[#7A459C]/45 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 -z-10 h-64 w-64 rounded-full bg-[#F6C84B]/15 blur-3xl"
            />

            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F8D76B]">
                  Featured parent review
                </div>

                <div className="mt-5">
                  <Stars rating={featuredReview.rating} size={19} />
                </div>
              </div>

              <Quote
                aria-hidden="true"
                size={52}
                className="shrink-0 fill-white/10 text-white/20"
              />
            </div>

            <blockquote className="mt-8">
              <p className="text-xl font-bold leading-9 tracking-[-0.015em] text-white sm:text-2xl sm:leading-10">
                “{featuredReview.text}”
              </p>
            </blockquote>

            <div className="mt-9 border-t border-white/15 pt-6">
              <p className="text-lg font-black">{featuredReview.parent}</p>

              <p className="mt-1 text-sm text-white/65">
                Google reviewer
              </p>

              <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/85">
                {featuredReview.highlight}
              </div>
            </div>
          </article>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {reviews.slice(0, 2).map((review) => (
              <article
                key={review.parent}
                className="group relative overflow-hidden rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#5B2A86]/20 hover:shadow-[0_22px_54px_rgba(52,20,68,0.09)] sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <Stars rating={review.rating} />

                  <Quote
                    aria-hidden="true"
                    size={30}
                    className="fill-[#F3EAF8] text-[#CBAFDC]"
                  />
                </div>

                <blockquote className="mt-5">
                  <p className="text-[15px] leading-7 text-[#514654]">
                    “{review.text}”
                  </p>
                </blockquote>

                <div className="mt-6 border-t border-[#5B2A86]/10 pt-5">
                  <p className="text-sm font-black text-[#2D1736]">
                    {review.parent}
                  </p>

                  <p className="mt-1 text-sm text-[#7B6F80]">
                    Google reviewer
                  </p>

                  <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                    {review.highlight}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {reviews.slice(2).map((review) => (
            <article
              key={review.parent}
              className="group rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#5B2A86]/20 hover:shadow-[0_22px_54px_rgba(52,20,68,0.09)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <Stars rating={review.rating} />

                <Quote
                  aria-hidden="true"
                  size={30}
                  className="fill-[#F3EAF8] text-[#CBAFDC]"
                />
              </div>

              <blockquote className="mt-5">
                <p className="text-[15px] leading-7 text-[#514654]">
                  “{review.text}”
                </p>
              </blockquote>

              <div className="mt-6 border-t border-[#5B2A86]/10 pt-5">
                <p className="text-sm font-black text-[#2D1736]">
                  {review.parent}
                </p>

                <p className="mt-1 text-sm text-[#7B6F80]">
                  Google reviewer
                </p>

                <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                  {review.highlight}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[30px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_18px_50px_rgba(52,20,68,0.07)] sm:p-8 lg:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Visit and experience it yourself
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                See why families feel comfortable choosing our centre.
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-[#6F6474] sm:text-base">
                Meet our teachers, explore the classrooms and discuss your
                child&apos;s programme, daycare needs or trial class directly
                with our admissions team.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Button
                href={site.whatsappVisit}
                external
                variant="primary"
                size="lg"
                leftIcon={
                  <MessageCircle aria-hidden="true" size={18} />
                }
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                aria-label="Chat with Kidzee Sector 12 Dwarka admissions on WhatsApp"
              >
                Chat With Admissions
              </Button>

              <Button
                href={site.googleReviews}
                external
                variant="secondary"
                size="lg"
                rightIcon={<ExternalLink aria-hidden="true" size={17} />}
                aria-label="See all Google reviews for Kidzee Sector 12 Dwarka"
              >
                See All Reviews
              </Button>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#817586] sm:text-sm">
          Review wording has been lightly edited for spelling and readability
          while preserving the original meaning shared publicly by parents on
          Google.
        </p>
      </Container>
    </section>
  );
}