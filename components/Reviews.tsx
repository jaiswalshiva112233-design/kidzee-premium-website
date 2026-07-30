"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";

type Review = {
  name: string;
  initials: string;
  rating: number;
  date: string;
  text: string;
};

const reviews: Review[] = [
  {
    name: "Komal Gahlot",
    initials: "KG",
    rating: 5,
    date: "2 months ago",
    text: "Pre school is great and trustworthy can send your child to school without worrying. The teachers share weekly feedback and activities of your child with their parents",
  },
  {
    name: "Ritu Singh",
    initials: "RS",
    rating: 5,
    date: "2 months ago",
    text: "Kidzee sector 12 is the real playschool where kids are learning in play way method. I'm so happy to send my child to this school. Clean environment and friendly staff, nice playschool.",
  },
  {
    name: "Minakshi Suman",
    initials: "MS",
    rating: 5,
    date: "2 months ago",
    text: "Feeling really good being part of kidzee. Everything here is just fab. Vibe is amazing. Staff is also very cooperative.",
  },
  {
    name: "Shailja Singh",
    initials: "SS",
    rating: 5,
    date: "2 months ago",
    text: "It is best preschool i would say. i am fully satisfied with the school in every manner like learning,talking, safety..and all teachers are very nice to treat children and my daughter is growing there and it's our best decision for her...thanku kidzee 🙂",
  },
  {
    name: "Thakur Sapna",
    initials: "TS",
    rating: 4,
    date: "2 months ago",
    text: "My daughter studies at Kidzee, and I am very happy with the school. Kidzee provides a happy and safe environment for children, and I am very satisfied as a mother. Mishika has become more confident and social now. I feel relaxed because the campus is safe and clean. The teachers and didi take very good care of the children.",
  },
  {
    name: "Pinky Badola",
    initials: "PB",
    rating: 5,
    date: "2 months ago",
    text: "I Had a very good experience with kidzee. The way they celebrated mother's day made the day most memorable for me and for my daughter, we both enjoyed the function infact, everyone enjoyed each and every task they had organised for us. I will look forward to have many more events like this❤️",
  },
];

const avatarStyles = [
  "bg-[#6f8e2f]",
  "bg-[#765245]",
  "bg-[#c84b12]",
  "bg-[#8154ca]",
  "bg-[#8c603f]",
  "bg-[#9026b6]",
];

function StarRating({
  rating,
  size = 18,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={2}
          className={
            star <= rating
              ? "fill-[#fbbc04] text-[#fbbc04]"
              : "fill-slate-100 text-slate-300"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  index,
}: {
  review: Review;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldShorten = review.text.length > 230;

  const displayedText =
    shouldShorten && !expanded
      ? `${review.text.slice(0, 230).trim()}...`
      : review.text;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: "easeOut",
      }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-purple-100 bg-white p-6 shadow-[0_16px_42px_rgba(62,25,83,0.07)] transition duration-300 hover:border-purple-200 hover:shadow-[0_25px_58px_rgba(62,25,83,0.13)] sm:p-7"
    >
      <Quote
        aria-hidden="true"
        size={72}
        className="absolute -right-2 -top-3 text-purple-50 transition duration-300 group-hover:text-purple-100"
      />

      <div className="relative flex items-center justify-between gap-4">
        <StarRating rating={review.rating} />

        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          Google review
        </span>
      </div>

      <blockquote className="relative mt-6 flex-1">
        <p className="text-[15px] leading-7 text-slate-600">
          “{displayedText}”
        </p>

        {shouldShorten && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-3 text-sm font-extrabold text-[#702a96] transition hover:text-[#512071]"
            aria-expanded={expanded}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </blockquote>

      <div className="relative mt-7 flex items-center gap-3 border-t border-purple-100 pt-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
            avatarStyles[index % avatarStyles.length]
          }`}
        >
          {review.initials}
        </div>

        <div>
          <p className="font-extrabold text-[#281036]">{review.name}</p>

          <p className="mt-1 text-xs text-slate-500">{review.date}</p>
        </div>

        <CheckCircle2
          size={18}
          className="ml-auto shrink-0 text-[#702a96]"
          aria-label="Review shown from Google"
        />
      </div>
    </motion.article>
  );
}

export default function Reviews() {
  const googleReviewsUrl =
    "https://www.google.com/search?q=Kidzee+Sector+12+Dwarka+reviews";

  const whatsappMessage = encodeURIComponent(
    "Hello, I would like to book a school visit at Kidzee Sector 12, Dwarka."
  );

  const whatsappLink = `https://wa.me/919667038673?text=${whatsappMessage}`;

  return (
    <section
      id="reviews"
      className="relative overflow-hidden bg-[#fffaf2] py-20 sm:py-24 lg:py-28"
      aria-labelledby="reviews-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.7fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
              <Sparkles size={16} />
              Parent reviews
            </div>

            <h2
              id="reviews-heading"
              className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
            >
              What parents genuinely say about{" "}
              <span className="text-[#702a96]">
                Kidzee Sector 12, Dwarka
              </span>
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              These reviews are shown from genuine feedback shared by families
              on our Google Business Profile. Individual ratings are displayed
              exactly as given by each reviewer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="rounded-[32px] bg-[#2d1636] p-7 text-white shadow-[0_24px_65px_rgba(45,22,54,0.2)] sm:p-8"
          >
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-yellow-300 text-3xl font-extrabold text-[#281036]">
                4.8
              </div>

              <div>
                <StarRating rating={5} size={20} />

                <p className="mt-3 text-lg font-extrabold text-white">
                  Google rating
                </p>

                <p className="mt-1 text-sm text-purple-200">
                  Based on 33+ reviews
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm leading-7 text-purple-100">
                Parents frequently mention the caring team, clean environment,
                regular feedback and growing confidence they see in their
                children.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.name}
              review={review}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-10 overflow-hidden rounded-[34px] border border-purple-100 bg-white p-7 shadow-[0_18px_50px_rgba(67,38,76,0.08)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-purple-100 text-[#702a96]">
                <MessageCircle size={23} />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                Hear from more families
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036]">
                Read the complete reviews directly on Google
              </h3>

              <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                Visit our Google profile to see more ratings, recent feedback,
                photographs shared by parents and our responses to individual
                reviews.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-6 text-sm font-extrabold text-[#702a96] transition duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-100"
              >
                View Google Reviews
                <ExternalLink size={16} />
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#702a96] px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(112,42,150,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#572075]"
              >
                Book a School Visit
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}