export const VERIFIED_FULL_CENTRE_ADDRESS =
  "Building No. 19, 1st Floor, Block-B, Parmanand Colony, Pocket 8, Block B, Sector 12 Dwarka, Dwarka, New Delhi, Delhi, 110078";

export const VERIFIED_SHORT_CENTRE_ADDRESS =
  "Building No. 19, Sector 12B, Dwarka";

type CentreAddressInput = {
  addressLine1?: unknown;
  addressLine2?: unknown;
  locality?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
};

function addressText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Identifies only the superseded CentreOS seed address. Owner-entered custom
 * addresses are never replaced by this compatibility guard.
 */
export function isLegacySeedCentreAddress(value: CentreAddressInput) {
  const line1 = addressText(value.addressLine1).toLowerCase();
  const line2 = addressText(value.addressLine2).toLowerCase();
  const postalCode = addressText(value.postalCode);

  return (
    line1 === "plot no. 19, block b" &&
    line2 === "sector 12b, dwarka" &&
    (!postalCode || postalCode === "110075")
  );
}

export function formatCentreAddress(value: CentreAddressInput) {
  if (isLegacySeedCentreAddress(value)) return VERIFIED_FULL_CENTRE_ADDRESS;

  return (
    [
      addressText(value.addressLine1),
      addressText(value.addressLine2),
      addressText(value.locality),
      addressText(value.city),
      addressText(value.state),
      addressText(value.postalCode),
    ]
      .filter(Boolean)
      .join(", ") || VERIFIED_FULL_CENTRE_ADDRESS
  );
}
