"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileSpreadsheet,
  GripHorizontal,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Receipt,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";

type GuideStep = {
  title: string;
  detail: string;
  detailHi?: string;
  highlight?: string;
  warning?: string;
};

type GuideWorkflow = {
  id: string;
  title: string;
  titleHi: string;
  category: "Admissions" | "Fees & Billing" | "Daily Ops" | "Staff & Expense" | "Safety & Records";
  icon: typeof UserPlus;
  targetHref: string;
  targetLabel: string;
  estimatedMinutes: string;
  criticalWarning?: string;
  keywords: string[];
  steps: GuideStep[];
};

const GUIDE_WORKFLOWS: GuideWorkflow[] = [
  {
    id: "record-fee-cash-upi",
    title: "Take Fee Payment & Issue Receipt (Cash / UPI)",
    titleHi: "Fees Kaise Collect Karein & Receipt Dein (Cash / UPI)",
    category: "Fees & Billing",
    icon: Receipt,
    targetHref: "/admin/fees",
    targetLabel: "Open Fees & Payments",
    estimatedMinutes: "2 mins",
    criticalWarning: "Always verify the 12-digit UPI UTR number or count physical cash before clicking Generate Receipt.",
    keywords: ["fee", "fees", "receipt", "cash", "upi", "pay", "payment", "paisa", "chalan", "bill", "collect"],
    steps: [
      {
        title: "Find the Student",
        detail: "Go to Fees & Payments and search the child's name in the search bar. Click on the student row.",
        detailHi: "Fees & Payments page par jaiye aur bache ka naam search kijiye. Bache ke row par click kijiye.",
        highlight: "Search by Student Name",
      },
      {
        title: "Click '+ Record Fee / Collect'",
        detail: "Look at the top-right corner of the student ledger and click the green '+ Record Fee' button.",
        detailHi: "Student ledger ke upar right corner mein green '+ Record Fee' button par click kijiye.",
        highlight: "Green '+ Record Fee' button",
      },
      {
        title: "Select Mode (CASH or UPI) & Enter Amount",
        detail: "Choose CASH if received in hand, or UPI if transferred via QR code. For UPI, type the 12-digit UTR/Ref ID.",
        detailHi: "Agar haath mein cash mila hai toh CASH select karein. Agar QR se aaya hai toh UPI select karke 12-digit Ref No daalein.",
        warning: "Never leave the reference number empty for UPI payments.",
      },
      {
        title: "Click 'Generate Receipt & Send on WhatsApp'",
        detail: "Review the billing month and click submit. A serial-numbered receipt (REC-2026-XXX) will be created and the PDF will be sent to the parent's WhatsApp.",
        detailHi: "Month check karke submit kijiye. Automatic serial number wali receipt ban jayegi aur parent ko WhatsApp chali jayegi.",
      },
    ],
  },
  {
    id: "new-walkin-enquiry",
    title: "Record New Parent Enquiry (Walk-in / Call)",
    titleHi: "Naye Parent Ki Enquiry Add Karein (Walk-in / Phone)",
    category: "Admissions",
    icon: UserPlus,
    targetHref: "/admin/enquiries",
    targetLabel: "Open Leads & Follow-ups",
    estimatedMinutes: "1 min",
    keywords: ["enquiry", "lead", "walkin", "parent", "call", "new", "naya", "phone", "visit", "admissions"],
    steps: [
      {
        title: "Go to Leads & Follow-ups",
        detail: "Click 'Leads & Follow-ups' in the left menu bar.",
        detailHi: "Left menu mein 'Leads & Follow-ups' par click kijiye.",
      },
      {
        title: "Click '+ New Enquiry' Button",
        detail: "Look at the top-right header and click the purple '+ New Enquiry' button.",
        detailHi: "Top-right mein purple rang ke '+ New Enquiry' button par click karein.",
        highlight: "'+ New Enquiry' in top-right",
      },
      {
        title: "Enter Parent & Child Details",
        detail: "Fill in Parent Name, 10-digit Mobile Number, Child Name, Date of Birth (or Age), and choose Programme (Playgroup, Nursery, Daycare).",
        detailHi: "Parent ka naam, 10-digit mobile number, bache ka naam, birth date aur class (Playgroup/Nursery) select karein.",
      },
      {
        title: "Select Source & Save",
        detail: "Choose Source: 'WALK_IN' (if visited in person) or 'PHONE_CALL'. Set next follow-up date for tomorrow and click Save.",
        detailHi: "Source mein 'WALK_IN' ya 'PHONE_CALL' select karein aur kal ka reminder daalkar Save karein.",
      },
    ],
  },
  {
    id: "schedule-campus-visit",
    title: "Schedule Campus Tour / Trial Class",
    titleHi: "Campus Tour Ya Trial Class Book Karein",
    category: "Admissions",
    icon: CalendarCheck,
    targetHref: "/admin/enquiries",
    targetLabel: "Open Leads Funnel",
    estimatedMinutes: "1 min",
    keywords: ["tour", "visit", "trial", "walkthrough", "schedule", "dekhe", "dekhne", "timing", "appointment"],
    steps: [
      {
        title: "Open the Parent's Enquiry",
        detail: "In Leads & Follow-ups, click on the parent's card or row to open their journey timeline.",
        detailHi: "Leads page par parent ke card par click karke unka details page kholiye.",
      },
      {
        title: "Click 'Schedule Visit / Trial'",
        detail: "In the workflow actions panel on the right, click 'Schedule Visit'.",
        detailHi: "Right side ke action panel mein 'Schedule Visit' par click kijiye.",
      },
      {
        title: "Pick Date & Time (e.g. 11:00 AM or 4:30 PM)",
        detail: "Choose a time slot when classrooms are calm and teachers can meet the child. Add a short note about parent expectations.",
        detailHi: "Date aur time select kijiye jab school calm ho aur teachers bache se mil sakein.",
      },
      {
        title: "Confirm & Send WhatsApp Invite",
        detail: "Click 'Save & Send Confirmation'. CentreOS will send an automatic WhatsApp invite with location pin to the parent.",
        detailHi: "Confirm karein. Parent ko school location pin aur invite automatic WhatsApp par chala jayega.",
      },
    ],
  },
  {
    id: "confirm-student-admission",
    title: "Convert Lead into Confirmed Student Admission",
    titleHi: "Enquiry Ko Final Admission Mein Convert Karein",
    category: "Admissions",
    icon: GraduationCap,
    targetHref: "/admin/admissions",
    targetLabel: "Open Admissions Desk",
    estimatedMinutes: "3 mins",
    criticalWarning: "Verify that child's age matches the class requirements and documents are verified before confirming.",
    keywords: ["admission", "admit", "convert", "student", "final", "enrol", "dakhila", "contract"],
    steps: [
      {
        title: "Open Admissions Desk",
        detail: "Navigate to 'Admissions' from the left navigation bar.",
        detailHi: "Left menu se 'Admissions' page par jaiye.",
      },
      {
        title: "Select Qualified Enquiry",
        detail: "Click 'New Admission' or click on an existing Qualified Enquiry that has paid admission fee.",
        detailHi: "'New Admission' par click karein ya Qualified list mein se parent select karein.",
      },
      {
        title: "Configure Enrollment Contract",
        detail: "Choose Academic Session (2026-27), Preschool Programme (e.g. Nursery), and Daycare plan (if needed). Set Joining Date.",
        detailHi: "Session (2026-27), Class, aur joining date select karein. Agar Daycare chahiye toh plan add karein.",
      },
      {
        title: "Document Verification Checkbox",
        detail: "Tick 'Documents Complete' once Birth Certificate and Aadhaar copies are in hand.",
        detailHi: "Birth Certificate aur Aadhaar milne par 'Documents Complete' par tick kijiye.",
        warning: "Discounts above 10% require prior Owner approval in the system.",
      },
      {
        title: "Confirm & Generate Draft Bill",
        detail: "Click 'Confirm Admission & Create Student'. The child is now added to the Student Directory, and Google Ads conversion is dispatched automatically!",
        detailHi: "'Confirm Admission' par click karein. Student profile ban jayegi aur Google Ads conversion automatic update ho jayega!",
      },
    ],
  },
  {
    id: "daily-student-attendance",
    title: "Mark Daily Morning Attendance",
    titleHi: "Daily Morning Attendance Mark Karein",
    category: "Daily Ops",
    icon: UserCheck,
    targetHref: "/admin/attendance",
    targetLabel: "Open Attendance Register",
    estimatedMinutes: "1 min",
    keywords: ["attendance", "present", "absent", "hazri", "morning", "roll", "register", "chhutti"],
    steps: [
      {
        title: "Open Attendance Register",
        detail: "Click 'Attendance' in the left menu. The register defaults to today's date and all active classes.",
        detailHi: "Left menu se 'Attendance' kholiye. Aaj ki date automatic open hogi.",
      },
      {
        title: "Quick-Mark All as Present",
        detail: "Click the top button 'Mark All Present' to save time.",
        detailHi: "Time bachane ke liye pehle 'Mark All Present' par click karein.",
      },
      {
        title: "Toggle Absentees to 'ABSENT'",
        detail: "Look through the list and click the red 'Absent' toggle next to any child who has not arrived by 9:30 AM.",
        detailHi: "Jo bache nahi aaye unke naam ke aage red 'Absent' par click kijiye.",
      },
      {
        title: "Click 'Save Attendance'",
        detail: "Click the purple 'Save Attendance' button. Daily records and parent safety logs are updated instantly.",
        detailHi: "Purple 'Save Attendance' button dabayein. Records turant update ho jayenge.",
      },
    ],
  },
  {
    id: "daycare-meal-pickup",
    title: "Daycare Routine & Evening Pickup Verification",
    titleHi: "Daycare Meals & Sham Ki Pickup Verify Karein",
    category: "Daily Ops",
    icon: Utensils,
    targetHref: "/admin/daycare",
    targetLabel: "Open Daycare Workspace",
    estimatedMinutes: "2 mins",
    criticalWarning: "NEVER release a child to an unknown person. The pickup person's photo must match the authorized guardian list.",
    keywords: ["daycare", "meal", "food", "lunch", "snack", "pickup", "shaam", "khana", "nanny", "nap"],
    steps: [
      {
        title: "Open Daycare Workspace",
        detail: "Click 'Daycare' in the left menu to view children currently on the daycare floor.",
        detailHi: "Left menu mein 'Daycare' par click karein.",
      },
      {
        title: "Log Meals & Nap Routine",
        detail: "Tick 'Lunch Served' and 'Evening Snack Served' as nannies complete feeding. Note any food preferences or nap hours.",
        detailHi: "Lunch aur evening snack hone par tick mark karein.",
      },
      {
        title: "Verify Authorized Pickup Person",
        detail: "When a guardian arrives at 6:00 PM / 7:00 PM, match their identity with the Primary/Secondary Guardian photo on file.",
        detailHi: "Jab guardian bache ko lene aayein, system mein photo match karke hi handover karein.",
      },
      {
        title: "Click 'Mark Picked Up'",
        detail: "Click 'Handover & Picked Up'. If the pickup was after scheduled plan hours, system will automatically calculate extra duty charges.",
        detailHi: "'Mark Picked Up' par click karein. Time record ho jayega.",
      },
    ],
  },
  {
    id: "log-petty-cash-expense",
    title: "Log Daily School Petty Cash Expense",
    titleHi: "Daily Petty Cash / Kharcha Note Karein",
    category: "Staff & Expense",
    icon: Wallet,
    targetHref: "/admin/expenses",
    targetLabel: "Open Expenses Desk",
    estimatedMinutes: "1 min",
    keywords: ["expense", "petty", "cash", "kharcha", "milk", "doodh", "cleaning", "grocery", "bill", "voucher"],
    steps: [
      {
        title: "Open Expenses Desk",
        detail: "Click 'Expenses' in the left menu.",
        detailHi: "Left menu se 'Expenses' page kholiye.",
      },
      {
        title: "Click '+ Add Expense'",
        detail: "Click the '+ Add Expense' button in the top right.",
        detailHi: "Top right mein '+ Add Expense' button dabayein.",
      },
      {
        title: "Fill Voucher Details",
        detail: "Enter Category (Groceries / Milk / Cleaning / Office Stationery), Amount in ₹, and payment mode (Petty Cash Drawer).",
        detailHi: "Category (Milk/Grocery/Cleaning), Amount (₹) aur Payment Mode enter karein.",
      },
      {
        title: "Attach Bill Photo & Save",
        detail: "Take a quick photo of the physical receipt/bill and attach it. Click 'Save Voucher'.",
        detailHi: "Kharche ki receipt ki photo upload karke 'Save Voucher' karein.",
      },
    ],
  },
  {
    id: "export-ca-reports",
    title: "Export Monthly Financials for Chartered Accountant",
    titleHi: "CA Ke Liye Monthly Excel Report Download Karein",
    category: "Safety & Records",
    icon: FileSpreadsheet,
    targetHref: "/admin/reports/ca-export",
    targetLabel: "Open CA Export Center",
    estimatedMinutes: "1 min",
    keywords: ["ca", "report", "excel", "accountant", "tax", "gst", "hisab", "download", "monthly"],
    steps: [
      {
        title: "Open CA Export Center",
        detail: "In the left menu, navigate to Reports ➔ CA Export.",
        detailHi: "Left menu mein Reports ➔ CA Export par click karein.",
      },
      {
        title: "Select Month & Year",
        detail: "Choose the calendar month (e.g. August 2026 or September 2026).",
        detailHi: "Jis mahine ka hisab chahiye woh Month aur Year select karein.",
      },
      {
        title: "Click 'Download CA Master Excel'",
        detail: "Click the green download button. A complete workbook with Fee Receipts, Cash Ledgers, and Verified Expenses will download instantly.",
        detailHi: "Green download button par click karein. Puri Excel sheet turant download ho jayegi.",
      },
    ],
  },
  {
    id: "resend-lost-receipt",
    title: "Parent Lost Receipt? Resend on WhatsApp in 2 Taps",
    titleHi: "Receipt Kho Gayi? WhatsApp Par Dubara Bhejein",
    category: "Fees & Billing",
    icon: FileCheck2,
    targetHref: "/admin/receipts",
    targetLabel: "Open Receipts History",
    estimatedMinutes: "30 secs",
    keywords: ["receipt", "lost", "resend", "whatsapp", "pdf", "dubara", "bhejo", "parent", "number"],
    steps: [
      {
        title: "Open Receipts List",
        detail: "Go to Receipts in the left menu. You will see all generated receipts in chronological order.",
        detailHi: "Left menu se Receipts kholiye. Saari receipts ki list dikhegi.",
      },
      {
        title: "Search Student or Receipt No.",
        detail: "Type the child's name in the search box to filter instantly.",
        detailHi: "Search box mein bache ka naam likhiye.",
      },
      {
        title: "Click the Green WhatsApp Icon",
        detail: "Click the green WhatsApp button next to the receipt. WhatsApp will open with the pre-filled PDF link ready to send!",
        detailHi: "Receipt ke aage green WhatsApp icon par click karein. Parent ko PDF chala jayega.",
      },
    ],
  },
  {
    id: "staff-leave-management",
    title: "Mark Teacher / Nanny Leave & Assign Substitute",
    titleHi: "Teacher Ki Leave Mark Karein & Substitute Lagayein",
    category: "Staff & Expense",
    icon: Users,
    targetHref: "/admin/staff",
    targetLabel: "Open Staff Workspace",
    estimatedMinutes: "1 min",
    keywords: ["staff", "teacher", "nanny", "leave", "chhutti", "absent", "substitute", "maid", "salary"],
    steps: [
      {
        title: "Open Staff Workspace",
        detail: "Click 'Staff' from the left navigation.",
        detailHi: "Left menu se 'Staff' par click karein.",
      },
      {
        title: "Select Teacher Name",
        detail: "Find the teacher in the list and click 'Leave & Attendance'.",
        detailHi: "Teacher ke naam par click karke 'Leave' option select karein.",
      },
      {
        title: "Mark Leave Type & Date",
        detail: "Choose Sick Leave or Planned Leave. System automatically logs this for monthly payroll calculation.",
        detailHi: "Leave date aur type select karein taaki payroll mein hisab theek rahe.",
      },
      {
        title: "Reassign Classroom Floor",
        detail: "Notify the co-teacher or assign a floating caregiver to ensure the 1:8 student-teacher ratio is maintained.",
        detailHi: "Co-teacher ko notify karein taaki 1:8 ratio maintain rahe.",
      },
    ],
  },
];

export default function CentreHeadGuide() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeWorkflow, setActiveWorkflow] = useState<GuideWorkflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Draggable state for the floating widget
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const hasMovedRef = useRef(false);

  const categories = ["ALL", "Admissions", "Fees & Billing", "Daily Ops", "Staff & Expense", "Safety & Records"];

  const filteredWorkflows = useMemo(() => {
    return GUIDE_WORKFLOWS.filter((wf) => {
      const matchesCategory = selectedCategory === "ALL" || wf.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = wf.title.toLowerCase().includes(q) || wf.titleHi.toLowerCase().includes(q);
      const inKeywords = wf.keywords.some((k) => k.toLowerCase().includes(q));
      const inSteps = wf.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.detail.toLowerCase().includes(q) ||
          (s.detailHi && s.detailHi.toLowerCase().includes(q)),
      );

      return inTitle || inKeywords || inSteps;
    });
  }, [searchQuery, selectedCategory]);

  const openWorkflow = (wf: GuideWorkflow) => {
    setActiveWorkflow(wf);
    setCurrentStepIndex(0);
  };

  const closeWorkflow = () => {
    setActiveWorkflow(null);
    setCurrentStepIndex(0);
  };

  const navigateToScreen = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Dragging handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }
    setPosition({
      x: dragStartRef.current.initialX + deltaX,
      y: dragStartRef.current.initialY + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe
    }
  };

  const handleClick = () => {
    if (!hasMovedRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* 1. Movable / Draggable Sticky Floating Widget (Like Mira) */}
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        className="fixed bottom-6 right-6 z-[9990] flex flex-col items-center select-none touch-none"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          className="group relative flex cursor-grab active:cursor-grabbing items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-[#2D1736] via-[#5B2A86] to-[#7E38B7] p-1 text-white shadow-[0_12px_35px_rgba(45,23,54,0.35)] transition-transform hover:scale-105 hover:shadow-[0_16px_40px_rgba(45,23,54,0.45)]"
        >
          {/* Subtle Drag Handle Indicator */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-1.5 py-0.2 text-[9px] font-bold text-[#5B2A86] shadow-sm flex items-center gap-0.5">
            <GripHorizontal size={10} />
            <span>Move</span>
          </div>

          <div className="h-13 w-13 rounded-full overflow-hidden border border-white/40 bg-[#5B2A86] flex items-center justify-center">
            <Image
              src="/images/mira/mira-centre-guide.png"
              alt="Centre Head Guide"
              width={52}
              height={52}
              className="h-full w-full object-cover pointer-events-none"
            />
          </div>

          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
          </span>
        </div>

        <span className="mt-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-black text-[#4C285C] shadow-[0_4px_14px_rgba(45,23,54,0.16)] border border-[#E6DBEE]">
          Centre Guide
        </span>
      </div>

      {/* 2. Full-Height Slide-Over Drawer on the Right Screen */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1E0B2B]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container (Attached to Root, Full Height, 100% Unclipped) */}
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-[-25px_0_60px_rgba(30,11,43,0.3)] border-l border-[#EBE3F2] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0E8F6] bg-gradient-to-r from-[#FAF5FD] to-white px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white shadow-md">
                  <Sparkles size={22} className="text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-[#2D1736] flex items-center gap-2">
                    <span>Centre Head SOP Guide</span>
                    <span className="rounded-md bg-[#5B2A86]/10 px-2 py-0.5 text-[10px] font-black text-[#5B2A86] uppercase tracking-wider">
                      Zero-Mistake
                    </span>
                  </h2>
                  <p className="text-xs text-[#7A6E82] truncate">
                    Point-to-point walkthroughs for all school operations
                  </p>
                </div>
              </div>

              {/* Language Switcher & Close */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-[#E6DBEE] bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLanguage("EN")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                      language === "EN" ? "bg-[#5B2A86] text-white shadow" : "text-[#7A6E82] hover:bg-[#FAF6FC]"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("HI")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                      language === "HI" ? "bg-[#5B2A86] text-white shadow" : "text-[#7A6E82] hover:bg-[#FAF6FC]"
                    }`}
                  >
                    हिंदी
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EEFA] text-[#5B2A86] transition hover:bg-[#EDE0F4]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body: Either Step Wizard OR Directory List */}
            {activeWorkflow ? (
              /* DETAIL VIEW: Interactive Point-to-Point Steps */
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="border-b border-[#F0E8F6] bg-[#FAF7FC] p-4 sm:p-5 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-md bg-[#5B2A86]/10 px-2 py-0.5 text-[11px] font-black text-[#5B2A86] mb-1">
                        {activeWorkflow.category} • {activeWorkflow.estimatedMinutes}
                      </span>
                      <h3 className="text-base font-black text-[#2D1736]">
                        {language === "HI" ? activeWorkflow.titleHi : activeWorkflow.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={closeWorkflow}
                      className="shrink-0 rounded-xl border border-[#E6DBEE] bg-white px-2.5 py-1 text-xs font-bold text-[#5B2A86] hover:bg-[#FAF6FC]"
                    >
                      ← Back
                    </button>
                  </div>

                  {activeWorkflow.criticalWarning && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-medium text-amber-900">
                      <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>
                        <strong className="font-black">Safety Rule: </strong>
                        {activeWorkflow.criticalWarning}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7A6E82]">
                      Step {currentStepIndex + 1} of {activeWorkflow.steps.length}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-[#EADBEE] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5B2A86] to-emerald-500 transition-all duration-300"
                        style={{
                          width: `${((currentStepIndex + 1) / activeWorkflow.steps.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-[#5B2A86]">
                      {Math.round(((currentStepIndex + 1) / activeWorkflow.steps.length) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto">
                  {activeWorkflow.steps.map((step, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isDone = idx < currentStepIndex;

                    return (
                      <div
                        key={step.title}
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                          isCurrent
                            ? "border-[#5B2A86] bg-[#FAF5FD] shadow-md ring-2 ring-[#5B2A86]/20"
                            : isDone
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-[#EFE7F4] bg-white opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                              isCurrent
                                ? "bg-[#5B2A86] text-white shadow"
                                : isDone
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#EADBEE] text-[#5B2A86]"
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={15} /> : idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-xs sm:text-sm font-black ${
                                isCurrent ? "text-[#5B2A86]" : isDone ? "text-emerald-900" : "text-[#2D1736]"
                              }`}
                            >
                              {step.title}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-[#5F5268]">
                              {language === "HI" && step.detailHi ? step.detailHi : step.detail}
                            </p>

                            {step.highlight && (
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-[#5B2A86] border border-[#EADBEE] shadow-sm">
                                <Lightbulb size={12} className="text-amber-500" />
                                <span>Look for: {step.highlight}</span>
                              </div>
                            )}

                            {step.warning && (
                              <p className="mt-1.5 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                                <ShieldAlert size={12} /> {step.warning}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[#F0E8F6] bg-white p-4 flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateToScreen(activeWorkflow.targetHref)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow transition hover:bg-emerald-700"
                  >
                    <span>🚀 {activeWorkflow.targetLabel}</span>
                    <ArrowRight size={13} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentStepIndex === 0}
                      onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                      className="rounded-xl border border-[#E6DBEE] bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={currentStepIndex === activeWorkflow.steps.length - 1}
                      onClick={() =>
                        setCurrentStepIndex((prev) => Math.min(activeWorkflow.steps.length - 1, prev + 1))
                      }
                      className="rounded-xl bg-[#5B2A86] px-3.5 py-1.5 text-xs font-black text-white shadow transition hover:bg-[#4E2373] disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* DIRECTORY VIEW */
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="p-4 border-b border-[#F0E8F6] bg-[#FAF7FC] shrink-0">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F7D9B]"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        language === "HI"
                          ? "Fees, admission, receipt, chhutti, kharcha..."
                          : "Search fees, admission, receipt, attendance..."
                      }
                      className="w-full rounded-2xl border border-[#E2D5EA] bg-white pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium text-[#2D1736] placeholder-[#9E8EAA] shadow-sm transition focus:border-[#5B2A86] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8F7D9B]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-black transition ${
                          selectedCategory === cat
                            ? "bg-[#5B2A86] text-white shadow"
                            : "border border-[#EADBEE] bg-white text-[#6F5F78] hover:bg-[#F8F2FB]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-2.5 overflow-y-auto">
                  {filteredWorkflows.length === 0 ? (
                    <div className="p-8 text-center">
                      <HelpCircle size={32} className="mx-auto text-[#9E8EAA]" />
                      <p className="mt-2 text-sm font-bold text-[#2D1736]">No guide found</p>
                      <p className="mt-1 text-xs text-[#7A6E82]">
                        Try searching "fees", "admission", "receipt" or "attendance".
                      </p>
                    </div>
                  ) : (
                    filteredWorkflows.map((wf) => {
                      const Icon = wf.icon;
                      return (
                        <div
                          key={wf.id}
                          onClick={() => openWorkflow(wf)}
                          className="group cursor-pointer rounded-2xl border border-[#EDE2F3] bg-white p-3.5 shadow-sm transition hover:border-[#5B2A86] hover:bg-[#FAF5FD]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F6EEFA] text-[#5B2A86] group-hover:bg-[#5B2A86] group-hover:text-white transition">
                                <Icon size={16} />
                              </div>
                              <span className="text-[11px] font-bold text-[#7A6E82]">{wf.category}</span>
                            </div>
                            <span className="rounded-md bg-[#F4EEF8] px-2 py-0.5 text-[10px] font-black text-[#6F5F78]">
                              {wf.steps.length} Steps
                            </span>
                          </div>

                          <h4 className="mt-2 text-xs sm:text-sm font-black text-[#2D1736] group-hover:text-[#5B2A86] transition">
                            {language === "HI" ? wf.titleHi : wf.title}
                          </h4>

                          <div className="mt-2 flex items-center justify-end text-[11px] font-black text-[#5B2A86]">
                            <span>Start Guide →</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
