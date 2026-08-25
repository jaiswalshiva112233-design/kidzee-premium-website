import Image from "next/image";
import {
  ArrowRight,
  Brain,
  Eye,
  Heart,
  Lightbulb,
  Search,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteMedia } from "@/lib/sanity/media";
import { pentemindLearningMinds } from "@/lib/site";

const mindIcons = [
  Heart,
  Sparkles,
  Eye,
  Search,
  Lightbulb,
] as const;

export default async function About() {
  const [mainMedia, classroomMedia, activityMedia] =
    await Promise.all([
      getWebsiteMedia("home.about.main"),
      getWebsiteMedia("home.about.smallOne"),
      getWebsiteMedia("home.about.smallTwo"),
    ]);

  const mainImage =
    mainMedia?.imageUrl ?? "/images/home/about/about-main.jpg";

  const classroomImage =
    classroomMedia?.imageUrl ??
    "/images/home/about/about-classroom1.jpg";

  const activityImage =
    activityMedia?.imageUrl ??
    "/images/home/about/about-classroom2.jpg";

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-20 h-80 w-80 rounded-full bg-[#F2E8F8]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-96 h-80 w-80 rounded-full bg-[#FFF3C8]/70 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 xl:gap-20">
          <div className="relative mx-auto w-full max-w-[650px]">
            <div className="grid grid-cols-[1.18fr_0.82fr] gap-3 sm:gap-4">
              <figure className="relative overflow-hidden rounded-[30px] border border-white bg-[#F8F3FC] shadow-[0_24px_64px_rgba(52,20,68,0.14)] sm:rounded-[36px]">
                <div className="relative aspect-[0.88/1]">
                  <Image
                    src={mainImage}
                    alt={
                      mainMedia?.altText ||
                      "Children learning with their teacher at Kidzee Sector 12 Dwarka"
                    }
                    fill
                    unoptimized={mainImage.startsWith("http")}
                    sizes="(max-width: 640px) 58vw, (max-width: 1024px) 54vw, 31vw"
                    className="object-cover"
                  />
                </div>
              </figure>

              <div className="grid gap-3 sm:gap-4">
                <figure className="relative overflow-hidden rounded-[24px] border border-white bg-[#FFF9E8] shadow-[0_18px_46px_rgba(52,20,68,0.1)] sm:rounded-[30px]">
                  <div className="relative h-full min-h-[180px]">
                    <Image
                      src={classroomImage}
                      alt={
                        classroomMedia?.altText ||
                        "Purpose-built preschool classroom in Sector 12 Dwarka"
                      }
                      fill
                      unoptimized={classroomImage.startsWith("http")}
                      sizes="(max-width: 640px) 36vw, (max-width: 1024px) 38vw, 21vw"
                      className="object-cover"
                    />
                  </div>
                </figure>

                <figure className="relative overflow-hidden rounded-[24px] border border-white bg-[#F8F3FC] shadow-[0_18px_46px_rgba(52,20,68,0.1)] sm:rounded-[30px]">
                  <div className="relative h-full min-h-[180px]">
                    <Image
                      src={activityImage}
                      alt={
                        activityMedia?.altText ||
                        "Children taking part in a guided preschool activity"
                      }
                      fill
                      unoptimized={activityImage.startsWith("http")}
                      sizes="(max-width: 640px) 36vw, (max-width: 1024px) 38vw, 21vw"
                      className="object-cover"
                    />
                  </div>
                </figure>
              </div>
            </div>

            <div className="absolute -bottom-5 left-4 right-4 rounded-[22px] border border-white/90 bg-white/95 p-4 shadow-[0_18px_46px_rgba(52,20,68,0.16)] backdrop-blur sm:left-8 sm:right-auto sm:max-w-[360px] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4CC] text-[#5B2A86]">
                  <Heart
                    aria-hidden="true"
                    size={18}
                    className="fill-[#F6C84B]"
                  />
                </span>

                <p className="text-sm font-bold leading-6 text-[#493B4F]">
                  A neighbourhood centre where children are known,
                  supported and encouraged at their own pace.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-2xl pt-5 lg:mx-0 lg:pt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <Brain aria-hidden="true" size={16} />
              Kidzee learning, delivered with local care
            </div>

            <h2
              id="about-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              Confidence first. Learning follows.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#6F6474] sm:text-lg">
              Starting preschool changes a child&apos;s little world. At
              Kidzee Sector 12, Dwarka, familiar routines, caring adults
              and purposeful play help that first step feel comfortable.
            </p>

            <p className="mt-4 text-base leading-8 text-[#6F6474] sm:text-lg">
              Children learn through stories, conversation, movement,
              art, exploration and time with one another—not by being
              hurried through a checklist.
            </p>

            <div className="mt-8">
              <Button
                href="/about"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
              >
                Meet Our Centre
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-[32px] border border-[#E6D8EC] bg-[#F8F4FC] p-5 sm:p-7 lg:mt-24 lg:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.64fr_1.36fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                The Péntemind approach
              </p>

              <h3 className="mt-3 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#281034]">
                Five ways of thinking, growing together.
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-[#6F6474]">
                Kidzee&apos;s Péntemind curriculum looks beyond
                memorising answers. It supports emotional, attentive,
                thoughtful, analytical and imaginative development
                through everyday learning experiences.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {pentemindLearningMinds.map((mind, index) => {
                const Icon = mindIcons[index];

                return (
                  <article
                    key={mind.name}
                    className="rounded-[22px] border border-[#E6D8EC] bg-white p-4 shadow-[0_10px_28px_rgba(40,16,52,0.05)]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                      <Icon
                        aria-hidden="true"
                        size={19}
                        strokeWidth={2.2}
                      />
                    </span>

                    <h4 className="mt-4 text-[0.94rem] font-black leading-5 text-[#281034]">
                      {mind.name}
                    </h4>

                    <p className="mt-1.5 text-xs font-bold leading-5 text-[#786B7D]">
                      {mind.focus}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}