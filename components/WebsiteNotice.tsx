import type { WebsiteOperationalSettings } from "@/lib/website/operationalSettings";

export default function WebsiteNotice({ settings }: { settings: WebsiteOperationalSettings }) {
  if (!settings.noticeEnabled || !settings.noticeText) return null;
  const content = <span>{settings.noticeText}</span>;
  return (
    <div className="bg-[#F6C84B] px-4 py-2 text-center text-xs font-black text-[#2D1736] sm:text-sm">
      {settings.noticeLink ? <a href={settings.noticeLink} className="underline decoration-2 underline-offset-2">{content}</a> : content}
    </div>
  );
}
