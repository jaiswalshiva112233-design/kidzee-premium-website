export type EnquiryOutboxParams = {
  enquiryId: string;
  enquiryNumber: string;
  created: boolean;
  source: string;
  submissionId: string;
  parentName: string;
  phone: { stored: string; matchKey?: string };
  childName: string | null;
  childAge: string | null;
  programmeValue: string;
  enquiryTypeValue: string;
  trafficChannel: string;
  requestClassification: {
    trafficClass: "GENUINE" | "INTERNAL" | "TEST" | "AUTOMATED" | string;
    isInternal: boolean;
    isTest: boolean;
  };
  attribution: {
    landingPage?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    [key: string]: unknown;
  };
  firstTouch?: unknown;
  lastTouch?: unknown;
  marketingConsent: boolean;
  receivedAt: Date;
};

export type EnquiryOutboxDeps = {
  createAdminNotification?: (data: any, client: any) => Promise<any>;
  queueWhatsAppAutomation?: (data: any, client: any) => Promise<any>;
  enqueueLeadConversions?: (enquiryId: string, client: any) => Promise<any>;
  defaultPhone?: string;
};

let cachedDeps: {
  createAdminNotification: (data: any, client: any) => Promise<any>;
  queueWhatsAppAutomation: (data: any, client: any) => Promise<any>;
  enqueueLeadConversions: (enquiryId: string, client: any) => Promise<any>;
  defaultPhone: string;
} | null = null;

async function resolveProductionDeps(): Promise<NonNullable<typeof cachedDeps>> {
  if (cachedDeps) return cachedDeps;
  const [adminMod, waMod, convMod, contactMod] = await Promise.all([
    import("@/lib/admin/notifications"),
    import("@/lib/whatsapp/automation"),
    import("@/lib/marketing/admissionConversions"),
    import("@/lib/siteContact"),
  ]);
  cachedDeps = {
    createAdminNotification: adminMod.createAdminNotification,
    queueWhatsAppAutomation: waMod.queueWhatsAppAutomation,
    enqueueLeadConversions: convMod.enqueueLeadConversions,
    defaultPhone: contactMod.defaultSiteContactSettings.phone,
  };
  return cachedDeps;
}

export async function persistEnquiryOutboxRecords(
  transaction: any,
  params: EnquiryOutboxParams,
  deps?: EnquiryOutboxDeps,
) {
  const resolved = deps && deps.createAdminNotification && deps.queueWhatsAppAutomation && deps.enqueueLeadConversions
    ? {
        createAdminNotification: deps.createAdminNotification,
        queueWhatsAppAutomation: deps.queueWhatsAppAutomation,
        enqueueLeadConversions: deps.enqueueLeadConversions,
        defaultPhone: deps.defaultPhone ?? "918800000000",
      }
    : await (async () => {
        const prod = await resolveProductionDeps();
        return {
          createAdminNotification: deps?.createAdminNotification ?? prod.createAdminNotification,
          queueWhatsAppAutomation: deps?.queueWhatsAppAutomation ?? prod.queueWhatsAppAutomation,
          enqueueLeadConversions: deps?.enqueueLeadConversions ?? prod.enqueueLeadConversions,
          defaultPhone: deps?.defaultPhone ?? prod.defaultPhone,
        };
      })();

  // 1. Audit log
  await transaction.activityLog.create({
    data: {
      action: "CREATED",
      entityType: "MARKETING_EVENT",
      entityId: params.submissionId,
      description: "Admission lead submitted from the public website.",
      newData: {
        eventName: "admission_lead_submitted",
        eventScope: "ADMISSION",
        leadType: "admission",
        enquiryId: params.enquiryId,
        enquiryNumber: params.enquiryNumber,
        submissionId: params.submissionId,
        trafficClass: params.requestClassification.trafficClass,
        isInternal: params.requestClassification.isInternal,
        isTest: params.requestClassification.isTest,
        landingPage: params.attribution.landingPage,
        utmSource: params.attribution.utmSource,
        utmMedium: params.attribution.utmMedium,
        utmCampaign: params.attribution.utmCampaign,
      },
    },
  });

  // 2. Firestore mirror outbox
  await transaction.activityLog.create({
    data: {
      action: "CREATED",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      entityId: params.submissionId,
      description: `Firestore mirror queued for enquiry ${params.enquiryNumber}`,
      newData: {
        submissionId: params.submissionId,
        enquiryNumber: params.enquiryNumber,
        status: "PENDING",
        attempts: 0,
        createdAt: params.receivedAt.toISOString(),
        payload: {
          leadSubmission: {
            submissionId: params.submissionId,
            enquiryNumber: params.enquiryNumber,
            parentName: params.parentName,
            phone: params.phone.stored,
            childName: params.childName,
            childAge: params.childAge,
            programme: params.programmeValue || null,
            enquiryType: params.enquiryTypeValue,
            leadType: "admission",
            trafficChannel: params.trafficChannel,
            trafficClass: params.requestClassification.trafficClass,
            attribution: params.attribution,
            firstTouch: params.firstTouch,
            lastTouch: params.lastTouch,
            status: "SAVED",
            receivedAt: params.receivedAt.toISOString(),
          },
          lead: {
            enquiryNumber: params.enquiryNumber,
            submissionId: params.submissionId,
            parentName: params.parentName,
            phone: params.phone.stored,
            childName: params.childName,
            childAge: params.childAge,
            programme: params.programmeValue || null,
            enquiryType: params.enquiryTypeValue,
            source: params.source,
            trafficChannel: params.trafficChannel,
            trafficClass: params.requestClassification.trafficClass,
            attribution: params.attribution,
            firstTouch: params.firstTouch,
            lastTouch: params.lastTouch,
            latestSubmissionAt: params.receivedAt.toISOString(),
            status: "NEW",
          },
        },
      },
    },
  });

  // 3. Admin Notification (if created and genuine)
  if (params.created && params.requestClassification.trafficClass === "GENUINE") {
    await resolved.createAdminNotification(
      {
        category: "ADMISSION",
        type: "NEW_ADMISSION_LEAD",
        priority: "HIGH",
        title: "New admission lead received",
        body: "A new website admission enquiry is ready for follow-up.",
        href: `/admin/enquiries/${params.enquiryId}`,
        entityType: "ENQUIRY",
        entityId: params.enquiryId,
        eventKey: params.submissionId,
        important: true,
      },
      transaction,
    );
  }

  // 4. WhatsApp Automation (if genuine)
  if (params.requestClassification.trafficClass === "GENUINE") {
    await resolved.queueWhatsAppAutomation(
      {
        type: "ENQUIRY_NOTIFICATION",
        deduplicationKey: `ENQUIRY_NOTIFICATION:${params.submissionId}`,
        recipientPhone: resolved.defaultPhone,
        enquiryId: params.enquiryId,
        messageText: `New website enquiry ${params.enquiryNumber} from ${params.parentName}.`,
        payload: {
          parameters: [
            params.enquiryNumber,
            params.parentName,
            params.childName || "Child",
            params.phone.stored,
          ],
        },
      },
      transaction,
    );
  }

  // 5. Marketing Conversions (if consent and genuine)
  if (params.marketingConsent && params.requestClassification.trafficClass === "GENUINE") {
    await resolved.enqueueLeadConversions(params.enquiryId, transaction);
  }
}
