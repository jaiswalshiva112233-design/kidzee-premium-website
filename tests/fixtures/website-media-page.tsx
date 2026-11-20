// Copied into app/ only by isolated build verification, then removed in finally.
import ParentReelPlayer from "@/components/Gallery/ParentReelPlayer";
import ExternalMediaEmbed from "@/components/Gallery/ExternalMediaEmbed";
import HeroSlideshow from "@/components/HeroSlideshow";
import AdmissionsCampaign from "@/components/admissions/AdmissionsCampaign";
import type { CampaignParentReview } from "@/lib/website/parentReviews";

export default async function MediaVerificationFixture({ searchParams }: { searchParams: Promise<{ campaignReviews?: string }> }) {
  const { campaignReviews } = await searchParams;
  if (campaignReviews) {
    // Synthetic UI fixtures, never included in a deployed app or written to the CMS.
    const reviews: CampaignParentReview[] = [
      { id: "one", poster: "/images/hero/hero-classroom.jpg", thumbnail: "/images/hero/hero-classroom.jpg", provider: "INSTAGRAM", source: "https://www.instagram.com/reel/Db78s7ehDRu/embed/", publicUrl: "https://www.instagram.com/reel/Db78s7ehDRu/" },
      { id: "two", poster: "/images/hero/hero-building.jpg", thumbnail: "/images/hero/hero-building.jpg", provider: "INSTAGRAM", source: "https://www.instagram.com/reel/DYg8ahfhUuq/embed/", publicUrl: "https://www.instagram.com/reel/DYg8ahfhUuq/" },
    ];
    if (campaignReviews === "native") reviews[0] = { ...reviews[0], provider: "VIDEO", source: "/videos/parent-reviews-dwarka-sec12.mp4", publicUrl: "/videos/parent-reviews-dwarka-sec12.mp4" };
    if (campaignReviews === "stored-images") reviews[0] = { ...reviews[0], poster: "https://firebasestorage.googleapis.com/v0/b/browser-fixture/o/web.webp?alt=media", thumbnail: "https://firebasestorage.googleapis.com/v0/b/browser-fixture/o/thumbnail.webp?alt=media" };
    if (campaignReviews === "many") for (let i = 3; i <= 12; i++) reviews.push({ ...reviews[0], id: `future-${i}` });
    return <AdmissionsCampaign parentReviewVideos={reviews} />;
  }
  const videos = [
    "/videos/playschool-security-review.mp4",
    "/videos/parent-reviews-dwarka-sec12.mp4",
    "/videos/aashvi-nursery-review.mp4",
    "https://cdn.sanity.io/files/4pj1t073/production/a1d8662fcecfad88d2b422f7e523fbddeebdf453.mp4",
    "https://cdn.sanity.io/files/4pj1t073/production/3ad11f761ff8054f8f5de430fc5a199f29172577.mp4",
  ];
  return <main style={{maxWidth:360,margin:"auto"}}>
    <h1>Isolated media verification</h1>
    <HeroSlideshow autoRotate={true} rotationIntervalSeconds={5} slides={[
      {id:"one",src:"/images/hero/hero-classroom.jpg",alt:"First classroom photograph"},
      {id:"two",src:"/images/hero/hero-building.jpg",alt:"Second centre photograph"},
    ]} />
    {videos.map((src,index)=><section key={src} data-video-fixture={index}>
      <ParentReelPlayer src={src} title={`Video ${index}`} analyticsName={`isolated_video_${index}`} />
    </section>)}
    <ExternalMediaEmbed provider="INSTAGRAM" embedUrl="https://www.instagram.com/reel/DYg8ahfhUuq/embed/" publicUrl="https://www.instagram.com/reel/DYg8ahfhUuq/" title="External video" />
  </main>;
}
