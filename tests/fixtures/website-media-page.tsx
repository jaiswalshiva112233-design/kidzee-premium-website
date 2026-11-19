// Copied into app/ only by isolated build verification, then removed in finally.
import ParentReelPlayer from "@/components/Gallery/ParentReelPlayer";
import ExternalMediaEmbed from "@/components/Gallery/ExternalMediaEmbed";
import HeroSlideshow from "@/components/HeroSlideshow";

export default function MediaVerificationFixture() {
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
