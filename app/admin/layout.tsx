import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kidzee Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F4FB]">
      {children}
    </div>
  );
}
