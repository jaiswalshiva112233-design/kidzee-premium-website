import assert from "node:assert/strict";
import test from "node:test";

import {
  formatCentreAddress,
  isLegacySeedCentreAddress,
} from "../lib/centreAddress.ts";

const legacyAddress = {
  addressLine1: "Plot No. 19, Block B",
  addressLine2: "Sector 12B, Dwarka",
  locality: "Dwarka",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "110075",
};

test("the exact superseded seed address is replaced at read time", () => {
  assert.equal(isLegacySeedCentreAddress(legacyAddress), true);
  assert.equal(
    formatCentreAddress(legacyAddress),
    "Building No. 19, 1st Floor, Block-B, Parmanand Colony, Pocket 8, Block B, Sector 12 Dwarka, Dwarka, New Delhi, Delhi, 110078",
  );
});

test("an Owner-entered custom address is preserved", () => {
  const custom = {
    addressLine1: "Custom building",
    addressLine2: "Custom road",
    locality: "Dwarka",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110078",
  };
  assert.equal(isLegacySeedCentreAddress(custom), false);
  assert.equal(
    formatCentreAddress(custom),
    "Custom building, Custom road, Dwarka, New Delhi, Delhi, 110078",
  );
});
