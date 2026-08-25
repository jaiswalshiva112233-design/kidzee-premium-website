-- Persistent campaign URLs and privacy-safe CentreOS web notifications.
CREATE TABLE "CampaignUrl" (
  "id" TEXT NOT NULL,
  "trackingKey" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "destinationType" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "campaignName" TEXT NOT NULL,
  "adSetName" TEXT,
  "creativeName" TEXT,
  "keyword" TEXT,
  "utmSource" TEXT NOT NULL,
  "utmMedium" TEXT NOT NULL,
  "utmCampaign" TEXT NOT NULL,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "finalUrl" TEXT NOT NULL,
  "landingPageId" TEXT,
  "createdById" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignUrl_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminNotification" (
  "id" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "important" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "snoozedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDevice" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL,
  "token" TEXT NOT NULL,
  "deviceName" TEXT NOT NULL,
  "browser" TEXT NOT NULL,
  "permissionStatus" TEXT NOT NULL DEFAULT 'GRANTED',
  "enabledCategories" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "enabledCategories" JSONB NOT NULL,
  "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
  "quietStart" TEXT NOT NULL DEFAULT '19:00',
  "quietEnd" TEXT NOT NULL DEFAULT '08:30',
  "detailedContentEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushNotificationDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushNotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignUrl_trackingKey_key" ON "CampaignUrl"("trackingKey");
CREATE UNIQUE INDEX "CampaignUrl_finalUrl_key" ON "CampaignUrl"("finalUrl");
CREATE INDEX "CampaignUrl_purpose_createdAt_idx" ON "CampaignUrl"("purpose", "createdAt");
CREATE INDEX "CampaignUrl_platform_createdAt_idx" ON "CampaignUrl"("platform", "createdAt");
CREATE INDEX "CampaignUrl_landingPageId_idx" ON "CampaignUrl"("landingPageId");
CREATE INDEX "CampaignUrl_createdById_idx" ON "CampaignUrl"("createdById");
CREATE UNIQUE INDEX "AdminNotification_idempotencyKey_key" ON "AdminNotification"("idempotencyKey");
CREATE INDEX "AdminNotification_recipientUserId_readAt_createdAt_idx" ON "AdminNotification"("recipientUserId", "readAt", "createdAt");
CREATE INDEX "AdminNotification_recipientUserId_category_createdAt_idx" ON "AdminNotification"("recipientUserId", "category", "createdAt");
CREATE INDEX "AdminNotification_priority_createdAt_idx" ON "AdminNotification"("priority", "createdAt");
CREATE UNIQUE INDEX "PushDevice_token_key" ON "PushDevice"("token");
CREATE INDEX "PushDevice_adminUserId_active_idx" ON "PushDevice"("adminUserId", "active");
CREATE INDEX "PushDevice_lastActiveAt_idx" ON "PushDevice"("lastActiveAt");
CREATE UNIQUE INDEX "NotificationPreference_adminUserId_key" ON "NotificationPreference"("adminUserId");
CREATE UNIQUE INDEX "PushNotificationDelivery_notificationId_deviceId_key" ON "PushNotificationDelivery"("notificationId", "deviceId");
CREATE INDEX "PushNotificationDelivery_status_nextAttemptAt_idx" ON "PushNotificationDelivery"("status", "nextAttemptAt");
CREATE INDEX "PushNotificationDelivery_deviceId_status_idx" ON "PushNotificationDelivery"("deviceId", "status");

ALTER TABLE "CampaignUrl" ADD CONSTRAINT "CampaignUrl_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignUrl" ADD CONSTRAINT "CampaignUrl_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushNotificationDelivery" ADD CONSTRAINT "PushNotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "AdminNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushNotificationDelivery" ADD CONSTRAINT "PushNotificationDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PushDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
