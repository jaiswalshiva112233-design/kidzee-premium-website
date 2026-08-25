"use client";

import {
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  ReceiptText,
  Search,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Programme =
  | "PLAYGROUP"
  | "NURSERY"
  | "JUNIOR_KG"
  | "SENIOR_KG"
  | "DAYCARE";

type FeeCategory =
  | "ADMISSION_FEE"
  | "ANNUAL_FEE"
  | "MONTHLY_PRESCHOOL_FEE"
  | "DAYCARE_FEE"
  | "DAYCARE_LUNCH_FEE"
  | "DAYCARE_EVENING_SNACK_FEE"
  | "DAYCARE_MEAL_COMBO_FEE"
  | "FOOD_FEE"
  | "LATE_FEE"
  | "ACTIVITY_FEE"
  | "KIT_FEE"
  | "OTHER";

type PaymentMethod =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CARD"
  | "CHEQUE"
  | "OTHER";

type InvoiceStatus =
  | "DRAFT"
  | "DUE"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED"
  | "WAIVED";

type LateFeeSetting = {
  id: string;
  dueDay: number;
  gracePeriodDays: number;
  calculationType:
    | "PER_DAY"
    | "FIXED";
  amount: number;
  maximumAmount: number | null;
  effectiveFrom: string;
};

type OpenInvoice = {
  id: string;
  invoiceNumber: string;
  category: FeeCategory;
  feePeriodKey: string | null;
  feePeriodLabel: string;
  dueDate: string;
  amountBeforeTax:
    | string
    | number;
  discountAmount:
    | string
    | number;
  lateFeeAmount:
    | string
    | number;
  gstApplicable: boolean;
  gstRate:
    | string
    | number
    | null;
  cgstAmount:
    | string
    | number;
  sgstAmount:
    | string
    | number;
  totalAmount:
    | string
    | number;
  paidAmount:
    | string
    | number;
  pendingAmount:
    | string
    | number;
  status: InvoiceStatus;
  items: Array<{
    id: string;
    category: FeeCategory;
    title: string;
    detail: string | null;
    amount: string | number;
    gstApplicable: boolean;
    gstRate: string | number | null;
    taxableAmount: string | number;
    cgstAmount: string | number;
    sgstAmount: string | number;
    totalAmount: string | number;
  }>;
};

type StudentOption = {
  id: string;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  programme: Programme;

  guardians: Array<{
    id: string;
    name: string;
    phone: string;
  }>;

  feeAccounts: Array<{
    id: string;
    category: FeeCategory;
    title: string;
    standardAmount:
      | string
      | number;
    gstApplicable: boolean;
    gstRate:
      | string
      | number
      | null;
  }>;

  openInvoices?: OpenInvoice[];
};

type FormData = {
  studentId: string;
  invoiceId: string;
  category: FeeCategory;
  feePeriodLabel: string;
  daycareHours: string;
  amountBeforeTax: string;
  discountAmount: string;
  applyLateFee: boolean;
  gstApplicable: boolean;
  gstRate: string;
  amountReceived: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  paymentDate: string;
  notes: string;
};

type LoadResponse = {
  success?: boolean;
  message?: string;
  students?: StudentOption[];
  lateFeeSetting?:
    | LateFeeSetting
    | null;
};

type SaveResponse = {
  success?: boolean;
  message?: string;

  receipt?: {
    id: string;
    receiptNumber: string;
  };
};

const recurringCategories =
  new Set<FeeCategory>([
    "MONTHLY_PRESCHOOL_FEE",
    "DAYCARE_LUNCH_FEE",
    "DAYCARE_EVENING_SNACK_FEE",
    "DAYCARE_MEAL_COMBO_FEE",
  ]);

const programmeLabels: Record<
  Programme,
  string
> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const categoryLabels: Record<
  FeeCategory,
  string
> = {
  ADMISSION_FEE:
    "Admission Fee",

  ANNUAL_FEE:
    "Annual Fee",

  MONTHLY_PRESCHOOL_FEE:
    "Monthly Preschool Fee",

  DAYCARE_FEE:
    "Daycare Hourly Fee",

  DAYCARE_LUNCH_FEE:
    "Daycare Lunch Plan",

  DAYCARE_EVENING_SNACK_FEE:
    "Daycare Evening Snack Plan",

  DAYCARE_MEAL_COMBO_FEE:
    "Lunch + Evening Snack Plan",

  FOOD_FEE:
    "Food Fee",

  LATE_FEE:
    "Late Fee",

  ACTIVITY_FEE:
    "Activity Fee",

  KIT_FEE:
    "Kit Fee",

  OTHER:
    "Other Fee",
};

const feeCategoryOptions:
  FeeCategory[] = [
    "MONTHLY_PRESCHOOL_FEE",
    "DAYCARE_FEE",
    "DAYCARE_LUNCH_FEE",
    "DAYCARE_EVENING_SNACK_FEE",
    "DAYCARE_MEAL_COMBO_FEE",
    "ANNUAL_FEE",
    "ADMISSION_FEE",
    "ACTIVITY_FEE",
    "KIT_FEE",
    "OTHER",
  ];

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  {
    value: "UPI",
    label: "UPI",
  },
  {
    value: "CASH",
    label: "Cash",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
  },
  {
    value: "CARD",
    label: "Card",
  },
  {
    value: "CHEQUE",
    label: "Cheque",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const invoiceStatusLabels:
  Record<
    InvoiceStatus,
    string
  > = {
    DRAFT: "Draft · review before collection",
    DUE: "Due",
    PARTIALLY_PAID:
      "Partially Paid",
    OVERDUE: "Overdue",
    PAID: "Paid",
    CANCELLED: "Cancelled",
    WAIVED: "Waived",
  };

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:bg-[#F5F2F7] disabled:text-[#817684]";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:bg-[#F5F2F7]";

function localInputDate(
  date = new Date(),
) {
  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() *
        60_000,
  );

  return local
    .toISOString()
    .slice(0, 10);
}

const today =
  localInputDate();

const currentMonth =
  today.slice(0, 7);

function createInitialForm():
  FormData {
  return {
    studentId: "",
    invoiceId: "",

    category:
      "MONTHLY_PRESCHOOL_FEE",

    feePeriodLabel:
      currentMonth,

    daycareHours: "1",
    amountBeforeTax: "",
    discountAmount: "0",
    applyLateFee: false,
    gstApplicable: false,
    gstRate: "",
    amountReceived: "",

    paymentMethod:
      "UPI",

    transactionReference: "",
    paymentDate: today,
    notes: "",
  };
}

function parseAmount(
  value:
    | string
    | number
    | null
    | undefined,
) {
  const parsed = Number(
    String(
      value ?? "",
    ).replace(/,/g, ""),
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

function formatCurrency(
  value:
    | string
    | number
    | null
    | undefined,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(
    parseAmount(value),
  );
}

function formatDate(
  value: string,
) {
  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(parsed);
}

function formatFeeMonth(
  value: string,
) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return value.trim();
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        1,
      ),
    ),
  );
}

function getStudentName(
  student: StudentOption,
) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function calculateLateFee(
  setting:
    | LateFeeSetting
    | null,
  feeMonth: string,
  paymentDate: string,
) {
  if (!setting) {
    return {
      amount: 0,
      daysLate: 0,
      dueDateLabel: "",
    };
  }

  const monthMatch =
    /^(\d{4})-(\d{2})$/.exec(
      feeMonth,
    );

  const paymentMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      paymentDate,
    );

  if (
    !monthMatch ||
    !paymentMatch
  ) {
    return {
      amount: 0,
      daysLate: 0,
      dueDateLabel: "",
    };
  }

  const year = Number(
    monthMatch[1],
  );

  const monthIndex =
    Number(
      monthMatch[2],
    ) - 1;

  const finalDay =
    new Date(
      Date.UTC(
        year,
        monthIndex + 1,
        0,
      ),
    ).getUTCDate();

  const dueDay =
    Math.min(
      Math.max(
        Math.trunc(
          setting.dueDay,
        ),
        1,
      ),
      finalDay,
    );

  const finalFreeDate =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        dueDay +
          Math.max(
            setting.gracePeriodDays,
            0,
          ),
      ),
    );

  const paidOn =
    new Date(
      Date.UTC(
        Number(
          paymentMatch[1],
        ),

        Number(
          paymentMatch[2],
        ) - 1,

        Number(
          paymentMatch[3],
        ),
      ),
    );

  const daysLate =
    Math.max(
      Math.floor(
        (paidOn.getTime() -
          finalFreeDate.getTime()) /
          86_400_000,
      ),
      0,
    );

  const rawAmount =
    daysLate === 0
      ? 0
      : setting.calculationType ===
          "FIXED"
        ? setting.amount
        : setting.amount *
          daysLate;

  const amount =
    setting.maximumAmount ==
    null
      ? rawAmount
      : Math.min(
          rawAmount,
          setting.maximumAmount,
        );

  return {
    amount:
      roundMoney(
        Math.max(
          amount,
          0,
        ),
      ),

    daysLate,

    dueDateLabel:
      formatDate(
        finalFreeDate.toISOString(),
      ),
  };
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
        <Icon
          aria-hidden="true"
          size={21}
        />
      </span>

      <div>
        <h3 className="text-lg font-black text-[#2D1736]">
          {title}
        </h3>

        <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={
          inputClassName
        }
      />
    </label>
  );
}

export default function CollectFeeForm({
  canAdjustInvoice = false,
}: {
  canAdjustInvoice?: boolean;
}) {
  const router = useRouter();

  const [
    students,
    setStudents,
  ] =
    useState<
      StudentOption[]
    >([]);

  const [
    lateFeeSetting,
    setLateFeeSetting,
  ] =
    useState<
      LateFeeSetting | null
    >(null);

  const [
    formData,
    setFormData,
  ] =
    useState<FormData>(
      createInitialForm,
    );

  const [
    studentSearch,
    setStudentSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    refreshingLedger,
    setRefreshingLedger,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    receipt,
    setReceipt,
  ] =
    useState<{
      id: string;
      number: string;
    } | null>(null);

  const paymentRequestRef = useRef<{
    fingerprint: string;
    key: string;
  } | null>(null);

  const loadFeeData =
    useCallback(
      async (refreshLedger = false) => {
        setLoading(true);

        try {
          if (refreshLedger) {
            const refreshResponse = await fetch("/api/admin/fees", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "refresh-ledger" }),
            });
            const refreshResult =
              (await refreshResponse.json()) as LoadResponse;

            if (!refreshResponse.ok || !refreshResult.success) {
              throw new Error(
                refreshResult.message ?? "Unable to refresh the fee ledger.",
              );
            }
          }

          const response =
            await fetch(
              "/api/admin/fees",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              },
            );

          const result =
            (await response.json()) as LoadResponse;

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ??
                "Unable to load fee information.",
            );
          }

          setStudents(
            result.students ??
              [],
          );

          setLateFeeSetting(
            result.lateFeeSetting ??
              null,
          );

          return true;
        } catch (loadError) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load fee information.",
          );

          return false;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    // Opening the workspace is read-only. Dues are generated only when the
    // administrator deliberately selects Refresh Dues.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFeeData();
  }, [loadFeeData]);

  async function handleRefreshLedger() {
    setError("");
    setSuccess("");
    setRefreshingLedger(true);

    const refreshed = await loadFeeData(true);

    if (refreshed) {
      setSuccess(
        "Fee dues refreshed. New monthly charges and overdue balances are ready.",
      );
    }

    setRefreshingLedger(false);
  }

  const selectedStudent =
    useMemo(
      () =>
        students.find(
          (student) =>
            student.id ===
            formData.studentId,
        ) ?? null,

      [
        students,
        formData.studentId,
      ],
    );

  const selectedInvoice =
    useMemo(
      () =>
        selectedStudent?.openInvoices?.find(
          (invoice) =>
            invoice.id ===
            formData.invoiceId,
        ) ?? null,

      [
        selectedStudent,
        formData.invoiceId,
      ],
    );

  const filteredStudents =
    useMemo(() => {
      const search =
        studentSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return students;
      }

      return students.filter(
        (student) => {
          const guardian =
            student.guardians[0];

          return [
            getStudentName(
              student,
            ),

            student.studentNumber,

            programmeLabels[
              student.programme
            ],

            guardian?.name,
            guardian?.phone,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search);
        },
      );
    }, [
      students,
      studentSearch,
    ]);

  const invoiceHasPayments =
    selectedInvoice != null &&
    parseAmount(
      selectedInvoice.paidAmount,
    ) > 0;

  const selectedInvoiceIsItemised =
    (selectedInvoice?.items.length ?? 0) > 0;

  const calculation =
    useMemo(() => {
      const configuredAmount =
        parseAmount(
          formData.amountBeforeTax,
        );

      const baseAmount =
        selectedInvoice
          ? parseAmount(
              selectedInvoice.amountBeforeTax,
            )
          : roundMoney(
              configuredAmount *
                (formData.category ===
                "DAYCARE_FEE"
                  ? Math.max(
                      parseAmount(
                        formData.daycareHours,
                      ),
                      0,
                    )
                  : 1),
            );

      const lateFeeCalculation =
        formData.category ===
          "MONTHLY_PRESCHOOL_FEE" &&
        formData.applyLateFee &&
        !invoiceHasPayments
          ? calculateLateFee(
              lateFeeSetting,
              formData.feePeriodLabel,
              formData.paymentDate,
            )
          : {
              amount: 0,
              daysLate: 0,
              dueDateLabel: "",
            };

      const discountAmount =
        invoiceHasPayments
          ? parseAmount(
              selectedInvoice?.discountAmount,
            )
          : parseAmount(
              formData.discountAmount,
            );

      const lateFeeAmount =
        invoiceHasPayments
          ? parseAmount(
              selectedInvoice?.lateFeeAmount,
            )
          : lateFeeCalculation.amount;

      const totalAmount =
        invoiceHasPayments
          ? parseAmount(
              selectedInvoice?.totalAmount,
            )
          : roundMoney(
              Math.max(
                baseAmount -
                  discountAmount +
                  lateFeeAmount,
                0,
              ),
            );

      const currentBalance =
        selectedInvoice
          ? invoiceHasPayments
            ? parseAmount(
                selectedInvoice.pendingAmount,
              )
            : totalAmount
          : totalAmount;

      const amountReceived =
        parseAmount(
          formData.amountReceived,
        );

      const balanceAfterPayment =
        roundMoney(
          Math.max(
            currentBalance -
              amountReceived,
            0,
          ),
        );

      const gstApplicable =
        selectedInvoice
          ? selectedInvoice.gstApplicable
          : formData.gstApplicable;

      const gstRate =
        gstApplicable
          ? parseAmount(
              selectedInvoice?.gstRate ??
                formData.gstRate,
            )
          : 0;

      const itemisedTaxScale =
        selectedInvoiceIsItemised &&
        baseAmount > 0
          ? Math.max(
              baseAmount -
                discountAmount,
              0,
            ) / baseAmount
          : 1;

      const cgstAmount =
        selectedInvoiceIsItemised
          ? roundMoney(
              parseAmount(
                selectedInvoice?.cgstAmount,
              ) * itemisedTaxScale,
            )
          : gstApplicable &&
              gstRate > 0
            ? roundMoney(
                (totalAmount -
                  totalAmount /
                    (1 +
                      gstRate /
                        100)) /
                  2,
              )
            : 0;

      const sgstAmount =
        selectedInvoiceIsItemised
          ? roundMoney(
              parseAmount(
                selectedInvoice?.sgstAmount,
              ) * itemisedTaxScale,
            )
          : gstApplicable &&
              gstRate > 0
            ? roundMoney(
                totalAmount -
                  totalAmount /
                    (1 +
                      gstRate /
                        100) -
                  cgstAmount,
              )
            : 0;

      const taxableAmount =
        roundMoney(
          totalAmount -
            cgstAmount -
            sgstAmount,
        );

      return {
        baseAmount,
        discountAmount,
        lateFeeAmount,

        lateFeeDays:
          lateFeeCalculation.daysLate,

        lateFeeDueDate:
          lateFeeCalculation.dueDateLabel,

        totalAmount,
        currentBalance,
        amountReceived,
        balanceAfterPayment,
        gstApplicable,
        gstRate,
        taxableAmount,
        cgstAmount,
        sgstAmount,
      };
    }, [
      formData,
      invoiceHasPayments,
      lateFeeSetting,
      selectedInvoice,
      selectedInvoiceIsItemised,
    ]);

  function updateField<
    Key extends keyof FormData,
  >(
    key: Key,
    value: FormData[Key],
  ) {
    setFormData(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setError("");
    setSuccess("");
    setReceipt(null);
  }

  function applyFeeAccount(
    student:
      | StudentOption
      | null,

    category:
      FeeCategory,
  ) {
    const account =
      student?.feeAccounts.find(
        (item) =>
          item.category ===
          category,
      );

    return {
      amountBeforeTax:
        account
          ? String(
              Number(
                account.standardAmount,
              ),
            )
          : "",

      gstApplicable:
        account?.gstApplicable ??
        false,

      gstRate:
        account?.gstRate ==
        null
          ? ""
          : String(
              Number(
                account.gstRate,
              ),
            ),
    };
  }

  function applyInvoice(
    invoice: OpenInvoice,
  ) {
    setFormData(
      (current) => ({
        ...current,

        invoiceId:
          invoice.id,

        category:
          invoice.category,

        feePeriodLabel:
          invoice.feePeriodKey ??
          invoice.feePeriodLabel,

        daycareHours:
          "1",

        amountBeforeTax:
          String(
            Number(
              invoice.amountBeforeTax,
            ),
          ),

        discountAmount:
          String(
            Number(
              invoice.discountAmount,
            ),
          ),

        applyLateFee:
          Number(
            invoice.lateFeeAmount,
          ) > 0,

        gstApplicable:
          invoice.gstApplicable,

        gstRate:
          invoice.gstRate ==
          null
            ? ""
            : String(
                Number(
                  invoice.gstRate,
                ),
              ),

        amountReceived: "",
      }),
    );

    setError("");
    setSuccess("");
    setReceipt(null);
  }

  function selectStudent(
    studentId: string,
  ) {
    const student =
      students.find(
        (item) =>
          item.id ===
          studentId,
      ) ?? null;

    const matchingInvoice =
      student?.openInvoices?.find(
        (invoice) =>
          invoice.feePeriodKey ===
            currentMonth &&
          invoice.items.length > 1,
      ) ??
      student?.openInvoices?.find(
        (invoice) =>
          invoice.feePeriodKey ===
            currentMonth &&
          [
            "MONTHLY_PRESCHOOL_FEE",
            "DAYCARE_FEE",
          ].includes(
            invoice.category,
          ),
      );

    if (matchingInvoice) {
      setFormData(
        (current) => ({
          ...current,
          studentId,
        }),
      );

      window.setTimeout(
        () =>
          applyInvoice(
            matchingInvoice,
          ),
        0,
      );

      return;
    }

    const configured =
      applyFeeAccount(
        student,
        "MONTHLY_PRESCHOOL_FEE",
      );

    setFormData(
      (current) => ({
        ...current,
        studentId,
        invoiceId: "",

        category:
          "MONTHLY_PRESCHOOL_FEE",

        feePeriodLabel:
          currentMonth,

        daycareHours: "1",
        discountAmount: "0",
        applyLateFee: false,
        amountReceived: "",
        ...configured,
      }),
    );

    setError("");
    setSuccess("");
    setReceipt(null);
  }

  function changeCategory(
    category: FeeCategory,
  ) {
    const invoices =
      selectedStudent?.openInvoices?.filter(
        (invoice) =>
          invoice.category ===
          category,
      ) ?? [];

    const matchingInvoice =
      recurringCategories.has(
        category,
      )
        ? invoices.find(
            (invoice) =>
              invoice.feePeriodKey ===
              currentMonth,
          )
        : invoices.length === 1
          ? invoices[0]
          : null;

    if (matchingInvoice) {
      applyInvoice(
        matchingInvoice,
      );

      return;
    }

    const configured =
      applyFeeAccount(
        selectedStudent,
        category,
      );

    setFormData(
      (current) => ({
        ...current,
        invoiceId: "",
        category,

        feePeriodLabel:
          recurringCategories.has(
            category,
          )
            ? currentMonth
            : "",

        daycareHours: "1",
        discountAmount: "0",
        applyLateFee: false,
        amountReceived: "",
        ...configured,
      }),
    );
  }

  function validateForm() {
    if (
      !formData.studentId
    ) {
      return "Please select a student.";
    }

    if (!selectedInvoice) {
      return "Refresh dues and select the prepared bill for this child.";
    }

    if (
      recurringCategories.has(
        formData.category,
      ) &&
      !/^\d{4}-\d{2}$/.test(
        formData.feePeriodLabel,
      )
    ) {
      return "Please select the fee month.";
    }

    if (
      calculation.baseAmount <= 0
    ) {
      return "Please enter a valid fee amount.";
    }

    if (
      formData.category ===
        "DAYCARE_FEE" &&
      !selectedInvoice &&
      parseAmount(
        formData.daycareHours,
      ) <= 0
    ) {
      return "Please enter valid Daycare hours.";
    }

    if (
      calculation.discountAmount >
      calculation.baseAmount
    ) {
      return "Discount cannot exceed the fee amount.";
    }

    if (
      formData.category ===
        "MONTHLY_PRESCHOOL_FEE" &&
      formData.applyLateFee &&
      !lateFeeSetting &&
      !invoiceHasPayments
    ) {
      return "No active late-fee rule is available. Check Fee & GST Settings.";
    }

    if (
      formData.gstApplicable &&
      !selectedInvoiceIsItemised &&
      (calculation.gstRate <=
        0 ||
        calculation.gstRate >
          100)
    ) {
      return "Please enter a valid GST percentage.";
    }

    if (
      calculation.amountReceived <=
      0
    ) {
      return "Please enter the amount received.";
    }

    if (
      calculation.amountReceived >
      calculation.currentBalance
    ) {
      return `Amount received cannot exceed ${formatCurrency(
        calculation.currentBalance,
      )}.`;
    }

    if (
      !formData.paymentDate
    ) {
      return "Please select the payment date.";
    }

    return "";
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (
      validationMessage
    ) {
      setError(
        validationMessage,
      );

      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    setReceipt(null);

    try {
      const requestBody = {
        ...formData,

        invoiceId:
          selectedInvoice?.id ??
          "",

        feePeriodLabel:
          recurringCategories.has(
            formData.category,
          )
            ? formatFeeMonth(
                formData.feePeriodLabel,
              )
            : formData.feePeriodLabel,

        amountBeforeTax:
          calculation.baseAmount.toString(),

        discountAmount:
          calculation.discountAmount.toString(),

        lateFeeAmount:
          calculation.lateFeeAmount.toString(),

        amountReceived:
          calculation.amountReceived.toString(),
      };

      const fingerprint = JSON.stringify(requestBody);
      const idempotencyKey =
        paymentRequestRef.current?.fingerprint === fingerprint
          ? paymentRequestRef.current.key
          : `fee:${globalThis.crypto.randomUUID()}`;

      paymentRequestRef.current = {
        fingerprint,
        key: idempotencyKey,
      };

      const response =
        await fetch(
          "/api/admin/fees",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              "Idempotency-Key":
                idempotencyKey,
            },

            body:
              JSON.stringify(requestBody),
          },
        );

      const result =
        (await response.json()) as SaveResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "The fee payment could not be saved.",
        );
      }

      setSuccess(
        result.message ??
          "Fee payment saved successfully.",
      );

      paymentRequestRef.current = null;

      if (result.receipt) {
        setReceipt({
          id:
            result.receipt.id,

          number:
            result.receipt.receiptNumber,
        });
      }

      setFormData(
        createInitialForm(),
      );

      setStudentSearch("");

      await loadFeeData();

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "The fee payment could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id="collect-fee"
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_22px_65px_rgba(45,23,54,0.1)]"
    >
      <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
              <ReceiptText
                aria-hidden="true"
                size={23}
              />
            </span>

            <div>
              <h2 className="text-xl font-black text-[#2D1736] sm:text-2xl">
                Collect Student Fee
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
                Select the child and the exact prepared bill. CentreOS keeps
                every partial payment, receipt and remaining balance attached
                to that bill.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleRefreshLedger()}
            disabled={loading || refreshingLedger || submitting}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#D9C9E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86] hover:bg-[#F8F2FB] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <RefreshCw
              aria-hidden="true"
              size={17}
              className={refreshingLedger ? "animate-spin" : ""}
            />
            {refreshingLedger ? "Refreshing…" : "Refresh Dues"}
          </button>
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 shrink-0"
                size={18}
              />

              <div>
                <p>
                  {success}
                </p>

                {receipt ? (
                  <a
                    href={`/admin/receipts/${receipt.id}`}
                    className="mt-2 inline-flex font-black text-[#5B2A86] underline"
                  >
                    Open receipt{" "}
                    {
                      receipt.number
                    }
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <section>
          <SectionTitle
            icon={UserRound}
            title="Select student"
            description="Search by student, parent, phone number or student number."
          />

          <div className="mt-5">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7D8F]"
                size={19}
              />

              <input
                type="search"
                value={
                  studentSearch
                }
                disabled={
                  loading ||
                  submitting
                }
                onChange={(
                  event,
                ) =>
                  setStudentSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search students"
                aria-label="Search students"
                className={`${inputClassName} mt-0 pl-12`}
              />
            </label>

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F5FA] p-6 text-sm font-bold text-[#817684]">
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />

                  Loading students
                </div>
              ) : filteredStudents.length ===
                0 ? (
                <div className="rounded-2xl border border-dashed border-[#DCCFE4] p-6 text-center text-sm font-bold text-[#817684]">
                  No active
                  students found.
                </div>
              ) : (
                filteredStudents.map(
                  (student) => {
                    const selected =
                      student.id ===
                      formData.studentId;

                    const guardian =
                      student
                        .guardians[0];

                    const dueTotal =
                      (
                        student.openInvoices ??
                        []
                      ).reduce(
                        (
                          total,
                          invoice,
                        ) =>
                          total +
                          parseAmount(
                            invoice.pendingAmount,
                          ),

                        0,
                      );

                    return (
                      <button
                        key={
                          student.id
                        }
                        type="button"
                        disabled={
                          submitting
                        }
                        onClick={() =>
                          selectStudent(
                            student.id,
                          )
                        }
                        className={[
                          "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition",

                          selected
                            ? "border-[#6A328F] bg-[#F5EDFA] shadow-sm"
                            : "border-[#E8E0EC] bg-white hover:border-[#B99ACD] hover:bg-[#FCFAFD]",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#2D1736]">
                            {getStudentName(
                              student,
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-[#817684]">
                            {
                              student.studentNumber
                            }{" "}
                            ·{" "}
                            {
                              programmeLabels[
                                student
                                  .programme
                              ]
                            }

                            {guardian
                              ? ` · ${guardian.name} · ${guardian.phone}`
                              : ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-[#8B7E90]">
                            Due
                          </p>

                          <p className="mt-1 font-black text-[#B45309]">
                            {formatCurrency(
                              dueTotal,
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  },
                )
              )}
            </div>
          </div>
        </section>

        {selectedStudent &&
        (selectedStudent
          .openInvoices
          ?.length ??
          0) > 0 ? (
          <section className="border-t border-[#EEE8F1] pt-8">
            <SectionTitle
              icon={Clock3}
              title="Open invoices"
              description="Select the exact bill being paid. Partial balances stay attached to the same invoice."
            />

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {selectedStudent.openInvoices?.map(
                (invoice) => {
                  const selected =
                    invoice.id ===
                    formData.invoiceId;

                  return (
                    <button
                      key={
                        invoice.id
                      }
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() =>
                        applyInvoice(
                          invoice,
                        )
                      }
                      className={[
                        "rounded-2xl border p-4 text-left transition",

                        selected
                          ? "border-[#6A328F] bg-[#F5EDFA] ring-2 ring-[#6A328F]/10"
                          : invoice.status ===
                              "OVERDUE"
                            ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                            : "border-[#E5DCE9] bg-white hover:border-[#B99ACD]",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7A459C]">
                            {
                              invoice.invoiceNumber
                            }
                          </p>

                          <p className="mt-1 font-black text-[#2D1736]">
                            {invoice.items.length > 1
                              ? "Combined monthly bill"
                              : invoice.items[0]?.title ??
                                categoryLabels[
                                  invoice
                                    .category
                                ]}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-[#817684]">
                            {
                              invoice.feePeriodLabel
                            }{" "}
                            · Due{" "}
                            {formatDate(
                              invoice.dueDate,
                            )}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase text-[#6A328F] shadow-sm">
                          {
                            invoiceStatusLabels[
                              invoice
                                .status
                            ]
                          }
                        </span>
                      </div>

                      {invoice.items.length > 0 ? (
                        <div className="mt-4 space-y-2 rounded-xl border border-white/70 bg-white/70 p-3">
                          {invoice.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-3 text-xs"
                              >
                                <div>
                                  <p className="font-black text-[#35243E]">
                                    {item.title}
                                  </p>
                                  {item.detail ? (
                                    <p className="mt-0.5 font-semibold text-[#817684]">
                                      {item.detail}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="shrink-0 font-black text-[#5B2A86]">
                                  {formatCurrency(
                                    item.totalAmount,
                                  )}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-[#8B7E90]">
                            Remaining
                            balance
                          </p>

                          <p className="mt-1 text-xl font-black text-[#B45309]">
                            {formatCurrency(
                              invoice.pendingAmount,
                            )}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-[#817684]">
                          Paid{" "}
                          {formatCurrency(
                            invoice.paidAmount,
                          )}
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>

          </section>
        ) : null}

        {selectedStudent && (selectedStudent.openInvoices?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCCFE4] bg-[#FAF8FC] p-5 text-sm font-bold leading-6 text-[#65596A]">
            No pending bill is ready for this child. If a new billing period or
            approved ledger charge is due, select <strong>Refresh Dues</strong>.
            Normal recurring fees cannot be entered manually here.
          </div>
        ) : null}

        <section className="border-t border-[#EEE8F1] pt-8">
          <SectionTitle
            icon={
              CircleDollarSign
            }
            title="Prepared bill"
            description={
              selectedInvoice
                ? `Payment will be recorded against ${selectedInvoice.invoiceNumber}.`
                : "Programme, daycare, meals and approved charges are calculated from the child's financial contract."
            }
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="hidden">
              <span className="text-sm font-black text-[#35243E]">
                Fee category *
              </span>

              <select
                value={
                  formData.category
                }
                disabled={
                  submitting ||
                  Boolean(
                    selectedInvoice,
                  )
                }
                onChange={(
                  event,
                ) =>
                  changeCategory(
                    event.target
                      .value as FeeCategory,
                  )
                }
                className={
                  inputClassName
                }
              >
                {feeCategoryOptions.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        categoryLabels[
                          category
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="hidden">
              <Field
                label="Fee period"
                value={formData.feePeriodLabel}
                disabled
                onChange={(value) => updateField("feePeriodLabel", value)}
              />
            </div>

            <div className="hidden">
              <Field
                label="Configured amount"
                type="number"
                value={formData.amountBeforeTax}
                disabled
                onChange={(value) => updateField("amountBeforeTax", value)}
              />
            </div>

            <Field
              label="Discount"
              type="number"
              value={
                formData.discountAmount
              }
              placeholder="0"
              disabled={
                submitting ||
                invoiceHasPayments ||
                !canAdjustInvoice
              }
              onChange={(value) =>
                updateField(
                  "discountAmount",
                  value,
                )
              }
            />

            {formData.category ===
            "MONTHLY_PRESCHOOL_FEE" ? (
              <label
                className={[
                  "flex items-start gap-3 rounded-2xl border p-4",

                  formData.applyLateFee
                    ? "border-amber-300 bg-amber-50"
                    : "border-[#E5DCE9] bg-[#FAF8FC]",

                  !lateFeeSetting ||
                  invoiceHasPayments
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer",
                ].join(
                  " ",
                )}
              >
                <input
                  type="checkbox"
                  checked={
                    formData.applyLateFee
                  }
                  disabled={
                    submitting ||
                    !lateFeeSetting ||
                    invoiceHasPayments
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "applyLateFee",
                      event.target
                        .checked,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-[#6A328F]"
                />

                <span>
                  <span className="block text-sm font-black text-[#35243E]">
                    Apply late
                    fee
                  </span>

                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                    {invoiceHasPayments
                      ? "Late fee is locked after the first payment."
                      : lateFeeSetting
                        ? `${formatCurrency(
                            lateFeeSetting.amount,
                          )} ${
                            lateFeeSetting.calculationType ===
                            "PER_DAY"
                              ? "per late day"
                              : "fixed charge"
                          }. Due by day ${lateFeeSetting.dueDay}.`
                        : "No active rule found in Fee & GST Settings."}
                  </span>
                </span>
              </label>
            ) : null}

            <label className="hidden">
              <input
                type="checkbox"
                checked={
                  formData.gstApplicable
                }
                disabled={
                  submitting ||
                  Boolean(
                    selectedInvoice,
                  )
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "gstApplicable",
                    event.target
                      .checked,
                  )
                }
                className="mt-1 h-4 w-4 accent-[#6A328F]"
              />

              <span>
                <span className="block text-sm font-black text-[#35243E]">
                  GST included
                </span>

                <span className="mt-1 block text-xs font-semibold text-[#817684]">
                  GST is
                  extracted from
                  the final price,
                  not added above
                  it.
                </span>
              </span>
            </label>

            {false && formData.gstApplicable &&
            !(
              selectedInvoiceIsItemised &&
              selectedInvoice?.gstRate == null
            ) ? (
              <Field
                label="GST percentage *"
                type="number"
                value={
                  formData.gstRate
                }
                placeholder="Example: 18"
                disabled={
                  submitting ||
                  Boolean(
                    selectedInvoice,
                  )
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "gstRate",
                    value,
                  )
                }
              />
            ) : selectedInvoiceIsItemised &&
              selectedInvoice?.gstApplicable &&
              selectedInvoice.gstRate == null ? (
              <div className="rounded-2xl border border-[#DCCFE4] bg-[#F4ECF8] p-4 text-sm font-bold leading-6 text-[#5B2A86]">
                GST rates are attached to each fee item. For example,
                daycare and food may use different inclusive rates.
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t border-[#EEE8F1] pt-8">
          <SectionTitle
            icon={Calculator}
            title="Payment calculation"
            description="Review the invoice balance before recording the amount received."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              [
                "Fee amount",
                calculation.baseAmount,
              ],

              [
                "Discount",
                calculation.discountAmount,
              ],

              [
                "Late fee",
                calculation.lateFeeAmount,
              ],

              [
                "Invoice total",
                calculation.totalAmount,
              ],

              [
                "Current balance",
                calculation.currentBalance,
              ],
            ].map(
              ([
                label,
                value,
              ]) => (
                <div
                  key={String(
                    label,
                  )}
                  className="rounded-2xl border border-[#E8E0EC] bg-[#FAF8FC] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.07em] text-[#8B7E90]">
                    {label}
                  </p>

                  <p className="mt-2 text-lg font-black text-[#2D1736]">
                    {formatCurrency(
                      value as number,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>

          {formData.applyLateFee &&
          calculation.lateFeeDays >
            0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              {
                calculation.lateFeeDays
              }{" "}
              late day(s),
              calculated after{" "}
              {
                calculation.lateFeeDueDate
              }
              .
            </div>
          ) : null}

          {calculation.gstApplicable ? (
            <div className="mt-4 rounded-2xl bg-[#F4ECF8] p-4 text-sm font-bold text-[#5B2A86]">
              {selectedInvoiceIsItemised &&
              selectedInvoice?.gstRate == null
                ? "GST is inclusive and calculated separately for each attached fee item:"
                : `GST ${calculation.gstRate}% is inclusive:`}
              {" "}
              taxable value{" "}
              {formatCurrency(
                calculation.taxableAmount,
              )}
              , CGST{" "}
              {formatCurrency(
                calculation.cgstAmount,
              )}{" "}
              and SGST{" "}
              {formatCurrency(
                calculation.sgstAmount,
              )}
              .
            </div>
          ) : null}
        </section>

        <section className="border-t border-[#EEE8F1] pt-8">
          <SectionTitle
            icon={CreditCard}
            title="Payment information"
            description="Enter the payment received today. Any remaining amount stays due."
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Amount
                received *
              </span>

              <div className="relative">
                <input
                  type="number"
                  value={
                    formData.amountReceived
                  }
                  disabled={
                    submitting
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "amountReceived",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Enter amount received"
                  className={`${inputClassName} pr-24`}
                />

                <button
                  type="button"
                  disabled={
                    submitting ||
                    calculation.currentBalance <=
                      0
                  }
                  onClick={() =>
                    updateField(
                      "amountReceived",
                      calculation.currentBalance.toString(),
                    )
                  }
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs font-black text-[#6A328F] disabled:opacity-40"
                >
                  Full balance
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Payment method
                *
              </span>

              <select
                value={
                  formData.paymentMethod
                }
                disabled={
                  submitting
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "paymentMethod",
                    event.target
                      .value as PaymentMethod,
                  )
                }
                className={
                  inputClassName
                }
              >
                {paymentMethods.map(
                  (method) => (
                    <option
                      key={
                        method.value
                      }
                      value={
                        method.value
                      }
                    >
                      {
                        method.label
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <Field
              label="Payment date *"
              type="date"
              value={
                formData.paymentDate
              }
              disabled={
                submitting
              }
              onChange={(value) =>
                updateField(
                  "paymentDate",
                  value,
                )
              }
            />

            <Field
              label="Transaction reference"
              value={
                formData.transactionReference
              }
              placeholder="UPI, bank or cheque reference"
              disabled={
                submitting
              }
              onChange={(value) =>
                updateField(
                  "transactionReference",
                  value,
                )
              }
            />

            <label className="block md:col-span-2">
              <span className="text-sm font-black text-[#35243E]">
                Internal notes
              </span>

              <textarea
                rows={3}
                value={
                  formData.notes
                }
                disabled={
                  submitting
                }
                placeholder="Optional note about this payment"
                onChange={(
                  event,
                ) =>
                  updateField(
                    "notes",
                    event.target
                      .value,
                  )
                }
                className={
                  textareaClassName
                }
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#2D1736] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#D9C6E2]">
                Balance after
                this payment
              </p>

              <p className="mt-1 text-2xl font-black">
                {formatCurrency(
                  calculation.balanceAfterPayment,
                )}
              </p>
            </div>

            <IndianRupee
              className="text-[#F4C542]"
              size={32}
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-[#EEE8F1] pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={
              submitting
            }
            onClick={() => {
              setFormData(
                createInitialForm(),
              );

              setStudentSearch(
                "",
              );

              setError("");
              setSuccess("");
              setReceipt(null);
            }}
            className="min-h-12 rounded-2xl border border-[#DCCFE4] bg-white px-6 text-sm font-black text-[#5B2A86] transition hover:bg-[#F8F4FA] disabled:opacity-60"
          >
            Clear form
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              !formData.studentId
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#6A328F] px-7 text-sm font-black text-white shadow-[0_12px_28px_rgba(106,50,143,0.25)] transition hover:bg-[#572576] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? (
              <LoaderCircle
                className="animate-spin"
                size={18}
              />
            ) : (
              <ReceiptText
                size={18}
              />
            )}

            {submitting
              ? "Saving payment..."
              : "Record Payment & Create Receipt"}
          </button>
        </div>
      </div>
    </form>
  );
}
