"use client";

import {
  Building2,
  CheckCircle2,
  FileSignature,
  ImageIcon,
  Landmark,
  LoaderCircle,
  MapPin,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  franchiseName: string;
  schoolCode: string;

  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  googleMapUrl: string;

  phone: string;
  alternatePhone: string;
  whatsapp: string;
  email: string;
  website: string;

  centreHeadName: string;
  centreHeadDesignation: string;
  centreHeadPhone: string;
  centreHeadEmail: string;

  studentCapacity: number;

  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  udyamNumber: string;

  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  upiId: string;

  logoUrl: string;
  whiteLogoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  upiQrUrl: string;

  receiptFooter: string;
  receiptTerms: string[];

  showLogoOnReceipt: boolean;
  showStampOnReceipt: boolean;
  showSignatureOnReceipt: boolean;
  showBankDetailsOnReceipt: boolean;
  showQrOnReceipt: boolean;
};

type SchoolProfileResponse = {
  success?: boolean;
  message?: string;
  profile?: SchoolProfile;
};

type DocumentImageField =
  | "logoUrl"
  | "whiteLogoUrl"
  | "stampUrl"
  | "signatureUrl"
  | "upiQrUrl";

type DocumentImageUploadResponse = {
  success?: boolean;
  message?: string;
  field?: DocumentImageField;
  imageUrl?: string;
};

const defaultProfile: SchoolProfile = {
  schoolName: "Kidzee Preschool & Daycare",
  centreName: "Kidzee Sector 12, Dwarka",
  franchiseName: "Kidzee",
  schoolCode: "",

  addressLine1: "Plot No. 19, Block B",
  addressLine2: "Sector 12B, Dwarka",
  locality: "Dwarka",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "",
  googleMapUrl: "",

  phone: "9667038673",
  alternatePhone: "",
  whatsapp: "9667038673",
  email: "kidzeepreschoolsector12@gmail.com",
  website: "https://kidzeedwarka.com",

  centreHeadName: "",
  centreHeadDesignation: "Centre Head",
  centreHeadPhone: "",
  centreHeadEmail: "",

  studentCapacity: 60,

  gstNumber: "",
  panNumber: "",
  registrationNumber: "",
  udyamNumber: "",

  bankName: "",
  accountName: "",
  accountNumber: "",
  ifscCode: "",
  bankBranch: "",
  upiId: "",

  logoUrl: "",
  whiteLogoUrl: "",
  stampUrl: "",
  signatureUrl: "",
  upiQrUrl: "",

  receiptFooter:
    "Thank you for choosing Kidzee Sector 12, Dwarka.",

  receiptTerms: [
    "The monthly fee is payable on or before the 5th of every month.",
    "A late fee of ₹50 per day may apply after the due date.",
    "Fees once paid are non-refundable and non-transferable, except where required by law or approved in writing by the centre management.",
    "Late pickup charges may apply according to the centre's current policy.",
    "Emergency daycare must be requested in advance and is subject to availability.",
    "Please retain this receipt for future reference.",
  ],

  showLogoOnReceipt: true,
  showStampOnReceipt: true,
  showSignatureOnReceipt: true,
  showBankDetailsOnReceipt: false,
  showQrOnReceipt: false,
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function SchoolInformationSettings() {
  const [profile, setProfile] =
    useState<SchoolProfile>(defaultProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] =
    useState<DocumentImageField | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/admin/settings/school-profile",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as SchoolProfileResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.profile
        ) {
          throw new Error(
            result.message ??
              "Unable to load school information.",
          );
        }

        setProfile(result.profile);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load school information.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function updateField<Key extends keyof SchoolProfile>(
    field: Key,
    value: SchoolProfile[Key],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function updateTerm(index: number, value: string) {
    setProfile((current) => ({
      ...current,
      receiptTerms: current.receiptTerms.map(
        (term, termIndex) =>
          termIndex === index ? value : term,
      ),
    }));

    setError("");
    setSuccessMessage("");
  }

  function addTerm() {
    setProfile((current) => ({
      ...current,
      receiptTerms:
        current.receiptTerms.length >= 20
          ? current.receiptTerms
          : [...current.receiptTerms, ""],
    }));
  }

  function removeTerm(index: number) {
    setProfile((current) => ({
      ...current,
      receiptTerms: current.receiptTerms.filter(
        (_, termIndex) => termIndex !== index,
      ),
    }));
  }

  function validateProfile() {
    if (!profile.schoolName.trim()) {
      return "School name is required.";
    }

    if (!profile.centreName.trim()) {
      return "Centre name is required.";
    }

    if (
      !Number.isInteger(profile.studentCapacity) ||
      profile.studentCapacity < 1 ||
      profile.studentCapacity > 10000
    ) {
      return "Student capacity must be a whole number between 1 and 10,000.";
    }

    if (!profile.phone.trim()) {
      return "Contact number is required.";
    }

    if (!profile.email.trim()) {
      return "Email address is required.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        profile.email.trim(),
      )
    ) {
      return "Please enter a valid school email address.";
    }

    if (
      profile.centreHeadEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        profile.centreHeadEmail.trim(),
      )
    ) {
      return "Please enter a valid centre-head email address.";
    }

    if (
      profile.receiptTerms.filter((term) =>
        term.trim(),
      ).length === 0
    ) {
      return "Please keep at least one receipt term.";
    }

    return "";
  }

  async function uploadDocumentImage(
    field: DocumentImageField,
    file: File,
  ) {
    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/png"
    ) {
      setError(
        "Please select a JPG or PNG image.",
      );
      setSuccessMessage("");
      return;
    }

    if (file.size === 0) {
      setError("The selected image is empty.");
      setSuccessMessage("");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError(
        "The image is too large. Please use a JPG or PNG smaller than 8 MB.",
      );
      setSuccessMessage("");
      return;
    }

    setUploadingField(field);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("field", field);
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/settings/school-profile",
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as DocumentImageUploadResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.imageUrl
      ) {
        throw new Error(
          result.message ??
            "Unable to upload the image.",
        );
      }

      setProfile((current) => ({
        ...current,
        [field]: result.imageUrl!,
      }));

      setSuccessMessage(
        result.message ??
          "The image was uploaded and saved.",
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the image.",
      );
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (uploadingField) {
      setError(
        "Please wait for the image upload to finish.",
      );
      return;
    }

    const validationMessage = validateProfile();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/settings/school-profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...profile,
            receiptTerms: profile.receiptTerms
              .map((term) => term.trim())
              .filter(Boolean),
          }),
        },
      );

      const result =
        (await response.json()) as SchoolProfileResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.profile
      ) {
        throw new Error(
          result.message ??
            "Unable to save school information.",
        );
      }

      setProfile(result.profile);

      setSuccessMessage(
        result.message ??
          "School information saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save school information.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-[#E9E2ED] bg-white">
        <LoaderCircle
          aria-hidden="true"
          size={30}
          className="animate-spin text-[#5B2A86]"
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
    >
      <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <Building2
              aria-hidden="true"
              size={22}
            />
          </span>

          <div>
            <h2 className="text-xl font-black text-[#2D1736] sm:text-2xl">
              School Information
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              These details will be used on receipts,
              admission forms, certificates and other
              CentreOS documents.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10 p-5 sm:p-6">
        <SettingsSection
          icon={Building2}
          title="Basic information"
          description="Main school and centre identity."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="School name *"
              value={profile.schoolName}
              disabled={saving}
              placeholder="Kidzee Preschool & Daycare"
              onChange={(value) =>
                updateField("schoolName", value)
              }
            />

            <TextField
              label="Centre name *"
              value={profile.centreName}
              disabled={saving}
              placeholder="Kidzee Sector 12, Dwarka"
              onChange={(value) =>
                updateField("centreName", value)
              }
            />

            <TextField
              label="Franchise name"
              value={profile.franchiseName}
              disabled={saving}
              placeholder="Kidzee"
              onChange={(value) =>
                updateField("franchiseName", value)
              }
            />

            <TextField
              label="School code"
              value={profile.schoolCode}
              disabled={saving}
              placeholder="Optional centre code"
              onChange={(value) =>
                updateField("schoolCode", value)
              }
            />

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Student capacity *
              </span>

              <input
                type="number"
                min="1"
                max="10000"
                step="1"
                value={profile.studentCapacity}
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "studentCapacity",
                    Number(event.target.value),
                  )
                }
                className={inputClassName}
              />

              <span className="mt-2 block text-xs font-semibold leading-5 text-[#8B7F8F]">
                Used for the dashboard occupancy and available-seat count.
              </span>
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={MapPin}
          title="Address and contact"
          description="Details shown on receipts and official documents."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Address line 1"
              value={profile.addressLine1}
              disabled={saving}
              placeholder="Plot No. 19, Block B"
              onChange={(value) =>
                updateField("addressLine1", value)
              }
            />

            <TextField
              label="Address line 2"
              value={profile.addressLine2}
              disabled={saving}
              placeholder="Sector 12B, Dwarka"
              onChange={(value) =>
                updateField("addressLine2", value)
              }
            />

            <TextField
              label="Locality"
              value={profile.locality}
              disabled={saving}
              placeholder="Dwarka"
              onChange={(value) =>
                updateField("locality", value)
              }
            />

            <TextField
              label="City"
              value={profile.city}
              disabled={saving}
              placeholder="New Delhi"
              onChange={(value) =>
                updateField("city", value)
              }
            />

            <TextField
              label="State"
              value={profile.state}
              disabled={saving}
              placeholder="Delhi"
              onChange={(value) =>
                updateField("state", value)
              }
            />

            <TextField
              label="PIN code"
              value={profile.postalCode}
              disabled={saving}
              placeholder="1100XX"
              onChange={(value) =>
                updateField("postalCode", value)
              }
            />

            <TextField
              label="Primary phone *"
              value={profile.phone}
              disabled={saving}
              placeholder="9667038673"
              onChange={(value) =>
                updateField("phone", value)
              }
            />

            <TextField
              label="Alternate phone"
              value={profile.alternatePhone}
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField(
                  "alternatePhone",
                  value,
                )
              }
            />

            <TextField
              label="WhatsApp number"
              value={profile.whatsapp}
              disabled={saving}
              placeholder="9667038673"
              onChange={(value) =>
                updateField("whatsapp", value)
              }
            />

            <TextField
              label="School email *"
              value={profile.email}
              disabled={saving}
              type="email"
              placeholder="school@example.com"
              onChange={(value) =>
                updateField("email", value)
              }
            />

            <TextField
              label="Website"
              value={profile.website}
              disabled={saving}
              placeholder="https://kidzeedwarka.com"
              onChange={(value) =>
                updateField("website", value)
              }
            />

            <TextField
              label="Google Map URL"
              value={profile.googleMapUrl}
              disabled={saving}
              placeholder="Paste Google Maps link"
              onChange={(value) =>
                updateField("googleMapUrl", value)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={UserRound}
          title="Centre head"
          description="Printed name and designation for documents and receipts."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Centre-head name"
              value={profile.centreHeadName}
              disabled={saving}
              placeholder="Full name"
              onChange={(value) =>
                updateField(
                  "centreHeadName",
                  value,
                )
              }
            />

            <TextField
              label="Designation"
              value={
                profile.centreHeadDesignation
              }
              disabled={saving}
              placeholder="Centre Head"
              onChange={(value) =>
                updateField(
                  "centreHeadDesignation",
                  value,
                )
              }
            />

            <TextField
              label="Centre-head phone"
              value={profile.centreHeadPhone}
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField(
                  "centreHeadPhone",
                  value,
                )
              }
            />

            <TextField
              label="Centre-head email"
              value={profile.centreHeadEmail}
              disabled={saving}
              type="email"
              placeholder="Optional"
              onChange={(value) =>
                updateField(
                  "centreHeadEmail",
                  value,
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={FileSignature}
          title="Legal information"
          description="Add only the details applicable to your centre."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="GST number"
              value={profile.gstNumber}
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField("gstNumber", value)
              }
            />

            <TextField
              label="PAN number"
              value={profile.panNumber}
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField("panNumber", value)
              }
            />

            <TextField
              label="Registration number"
              value={
                profile.registrationNumber
              }
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField(
                  "registrationNumber",
                  value,
                )
              }
            />

            <TextField
              label="UDYAM number"
              value={profile.udyamNumber}
              disabled={saving}
              placeholder="Optional"
              onChange={(value) =>
                updateField("udyamNumber", value)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Landmark}
          title="Bank and payment details"
          description="Used only when enabled for receipts or payment documents."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Bank name"
              value={profile.bankName}
              disabled={saving}
              placeholder="Bank name"
              onChange={(value) =>
                updateField("bankName", value)
              }
            />

            <TextField
              label="Account name"
              value={profile.accountName}
              disabled={saving}
              placeholder="Account-holder name"
              onChange={(value) =>
                updateField("accountName", value)
              }
            />

            <TextField
              label="Account number"
              value={profile.accountNumber}
              disabled={saving}
              placeholder="Bank account number"
              onChange={(value) =>
                updateField(
                  "accountNumber",
                  value,
                )
              }
            />

            <TextField
              label="IFSC code"
              value={profile.ifscCode}
              disabled={saving}
              placeholder="IFSC code"
              onChange={(value) =>
                updateField("ifscCode", value)
              }
            />

            <TextField
              label="Bank branch"
              value={profile.bankBranch}
              disabled={saving}
              placeholder="Branch name"
              onChange={(value) =>
                updateField("bankBranch", value)
              }
            />

            <TextField
              label="UPI ID"
              value={profile.upiId}
              disabled={saving}
              placeholder="example@upi"
              onChange={(value) =>
                updateField("upiId", value)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={ImageIcon}
          title="Branding and document images"
          description="Upload the images used on receipts and official documents. JPG and PNG files are supported up to 8 MB."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DocumentImageUploadCard
              field="logoUrl"
              label="Official logo"
              description="Shown on fee receipts and centre documents when logo display is enabled."
              value={profile.logoUrl}
              disabled={
                saving || uploadingField !== null
              }
              uploading={uploadingField === "logoUrl"}
              onUpload={uploadDocumentImage}
              onChange={(value) =>
                updateField("logoUrl", value)
              }
            />

            <DocumentImageUploadCard
              field="whiteLogoUrl"
              label="White logo"
              description="Use the light or white logo version for dark document backgrounds."
              value={profile.whiteLogoUrl}
              darkPreview
              disabled={
                saving || uploadingField !== null
              }
              uploading={
                uploadingField === "whiteLogoUrl"
              }
              onUpload={uploadDocumentImage}
              onChange={(value) =>
                updateField("whiteLogoUrl", value)
              }
            />

            <DocumentImageUploadCard
              field="stampUrl"
              label="School stamp"
              description="Shown beside the authorised signature when stamp display is enabled."
              value={profile.stampUrl}
              disabled={
                saving || uploadingField !== null
              }
              uploading={uploadingField === "stampUrl"}
              onUpload={uploadDocumentImage}
              onChange={(value) =>
                updateField("stampUrl", value)
              }
            />

            <DocumentImageUploadCard
              field="signatureUrl"
              label="Authorised signature"
              description="Shown in the receipt signatory area when signature display is enabled."
              value={profile.signatureUrl}
              disabled={
                saving || uploadingField !== null
              }
              uploading={
                uploadingField === "signatureUrl"
              }
              onUpload={uploadDocumentImage}
              onChange={(value) =>
                updateField("signatureUrl", value)
              }
            />

            <DocumentImageUploadCard
              field="upiQrUrl"
              label="UPI QR code"
              description="Shown with payment details when QR display is enabled."
              value={profile.upiQrUrl}
              disabled={
                saving || uploadingField !== null
              }
              uploading={uploadingField === "upiQrUrl"}
              onUpload={uploadDocumentImage}
              onChange={(value) =>
                updateField("upiQrUrl", value)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={ReceiptText}
          title="Receipt content"
          description="Control receipt footer, terms and visible elements."
        >
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Receipt footer
              </span>

              <textarea
                value={profile.receiptFooter}
                disabled={saving}
                rows={3}
                placeholder="Thank-you message shown on receipts"
                onChange={(event) =>
                  updateField(
                    "receiptFooter",
                    event.target.value,
                  )
                }
                className={textareaClassName}
              />
            </label>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#35243E]">
                    Terms and conditions
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-[#817684]">
                    These terms will appear at the bottom of
                    the printable receipt.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving ||
                    profile.receiptTerms.length >= 20
                  }
                  onClick={addTerm}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus
                    aria-hidden="true"
                    size={15}
                  />
                  Add Term
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {profile.receiptTerms.map(
                  (term, index) => (
                    <div
                      key={`${index}-${term.slice(0, 10)}`}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3EAF8] text-xs font-black text-[#5B2A86]">
                        {index + 1}
                      </span>

                      <textarea
                        value={term}
                        disabled={saving}
                        rows={2}
                        placeholder="Enter receipt term"
                        onChange={(event) =>
                          updateTerm(
                            index,
                            event.target.value,
                          )
                        }
                        className={textareaClassName}
                      />

                      <button
                        type="button"
                        disabled={
                          saving ||
                          profile.receiptTerms.length <= 1
                        }
                        onClick={() =>
                          removeTerm(index)
                        }
                        aria-label={`Remove receipt term ${
                          index + 1
                        }`}
                        className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2
                          aria-hidden="true"
                          size={17}
                        />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <ToggleCard
                label="Show logo"
                description="Display logo on receipt."
                checked={profile.showLogoOnReceipt}
                disabled={saving}
                onChange={(checked) =>
                  updateField(
                    "showLogoOnReceipt",
                    checked,
                  )
                }
              />

              <ToggleCard
                label="Show stamp"
                description="Display school stamp."
                checked={profile.showStampOnReceipt}
                disabled={saving}
                onChange={(checked) =>
                  updateField(
                    "showStampOnReceipt",
                    checked,
                  )
                }
              />

              <ToggleCard
                label="Show signature"
                description="Display centre-head signature."
                checked={
                  profile.showSignatureOnReceipt
                }
                disabled={saving}
                onChange={(checked) =>
                  updateField(
                    "showSignatureOnReceipt",
                    checked,
                  )
                }
              />

              <ToggleCard
                label="Show bank details"
                description="Display bank information."
                checked={
                  profile.showBankDetailsOnReceipt
                }
                disabled={saving}
                onChange={(checked) =>
                  updateField(
                    "showBankDetailsOnReceipt",
                    checked,
                  )
                }
              />

              <ToggleCard
                label="Show QR"
                description="Display verification or UPI QR."
                checked={profile.showQrOnReceipt}
                disabled={saving}
                onChange={(checked) =>
                  updateField(
                    "showQrOnReceipt",
                    checked,
                  )
                }
              />
            </div>
          </div>
        </SettingsSection>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
          >
            <CheckCircle2
              aria-hidden="true"
              size={19}
              className="mt-0.5 shrink-0"
            />

            {successMessage}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex justify-end border-t border-[#EEE8F1] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
        <button
          type="submit"
          disabled={saving || uploadingField !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          {saving ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
              Saving School Information…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                size={18}
              />
              Save School Information
            </>
          )}
        </button>
      </div>
    </form>
  );
}

type SettingsSectionProps = {
  icon: typeof Building2;
  title: string;
  description: string;
  children: React.ReactNode;
};

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="border-b border-[#EEE8F1] pb-10 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
          <Icon aria-hidden="true" size={19} />
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

      <div className="mt-6">{children}</div>
    </section>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  onChange,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </label>
  );
}

type DocumentImageUploadCardProps = {
  field: DocumentImageField;
  label: string;
  description: string;
  value: string;
  disabled?: boolean;
  uploading: boolean;
  darkPreview?: boolean;
  onUpload: (
    field: DocumentImageField,
    file: File,
  ) => Promise<void>;
  onChange: (value: string) => void;
};

function DocumentImageUploadCard({
  field,
  label,
  description,
  value,
  disabled,
  uploading,
  darkPreview = false,
  onUpload,
  onChange,
}: DocumentImageUploadCardProps) {
  const inputId = `document-image-${field}`;

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-[#E5DCE9] bg-[#FCFAFD] p-4">
      <div
        className={[
          "flex h-36 items-center justify-center overflow-hidden rounded-[18px] border border-[#E5DCE9] p-4",
          darkPreview
            ? "bg-[#2D1736]"
            : "bg-white",
        ].join(" ")}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={`${label} preview`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <ImageIcon
              aria-hidden="true"
              size={32}
              className={
                darkPreview
                  ? "mx-auto text-white/60"
                  : "mx-auto text-[#B6AABD]"
              }
            />

            <p
              className={[
                "mt-2 text-xs font-black",
                darkPreview
                  ? "text-white/70"
                  : "text-[#817684]",
              ].join(" ")}
            >
              No image uploaded
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex-1">
        <h4 className="text-sm font-black text-[#35243E]">
          {label}
        </h4>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
          {description}
        </p>
      </div>

      <label
        htmlFor={inputId}
        className={[
          "mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(91,42,134,0.18)] transition",
          disabled
            ? "cursor-not-allowed opacity-55"
            : "cursor-pointer hover:-translate-y-0.5 hover:bg-[#4B206F]",
        ].join(" ")}
      >
        {uploading ? (
          <LoaderCircle
            aria-hidden="true"
            size={17}
            className="animate-spin"
          />
        ) : (
          <Upload aria-hidden="true" size={17} />
        )}

        {uploading
          ? "Uploading image…"
          : value
            ? "Replace image"
            : "Upload image"}
      </label>

      <input
        id={inputId}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.currentTarget.value = "";

          if (file) {
            void onUpload(field, file);
          }
        }}
      />

      <label className="mt-4 block">
        <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#817684]">
          Image URL
        </span>

        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder="Upload an image or paste its URL"
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#DCCFE4] bg-white px-3 text-xs font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("")}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" size={15} />
          Clear image, then save
        </button>
      ) : null}

      <p className="mt-3 text-[11px] font-semibold leading-5 text-[#958A99]">
        Uploaded images are saved automatically. If you
        paste or clear a URL, use Save School Information.
      </p>
    </article>
  );
}

type ToggleCardProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleCard({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleCardProps) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
        checked
          ? "border-[#BFA8CC] bg-[#F7F0FA]"
          : "border-[#E6DEE9] bg-[#FAF8FC]",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 accent-[#5B2A86]"
      />

      <span>
        <span className="block text-sm font-black text-[#2D1736]">
          {label}
        </span>

        <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
          {description}
        </span>
      </span>
    </label>
  );
}
