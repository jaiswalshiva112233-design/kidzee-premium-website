export type ForwardingNumber = { originalNumber: string; formattedNumber: string; mobileNumber: string };

function dialDigits(value: string) {
  const digits = value.replace(/^tel:/i, "").split(/[;?]/)[0].replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  return digits;
}

export function phoneForwardingPlan(number: ForwardingNumber) {
  const mobile = number.mobileNumber.replace(/[\s().-]/g, "");
  const original = dialDigits(number.originalNumber);
  if (!/^\+[1-9]\d{7,14}$/.test(mobile) || original.length < 10 ||
      !/^[+\d\s().-]{5,64}$/.test(number.formattedNumber) || number.formattedNumber.replace(/\D/g, "").length < 7) return null;
  const separator = "[\\s().-]*";
  const local = original.startsWith("91") && original.length === 12 ? original.slice(2) : original;
  const prefix = local === original ? "\\+?" : "(?:\\+?91" + separator + ")?";
  const pattern = new RegExp("(?<!\\d)" + prefix + local.split("").join(separator) + "(?!\\d)", "g");
  return {
    href: "tel:" + mobile,
    matches: (href: string) => dialDigits(href) === original,
    replaceText: (text: string) => text.replace(pattern, () => number.formattedNumber),
  };
}

// Google supplies the forwarding number. Never infer call duration from a click.
export function startWebsiteCallForwarding(number: ForwardingNumber, root: Document = document) {
  const plan = phoneForwardingPlan(number);
  if (!plan || !root.body) return () => {};
  const links = new Map<HTMLAnchorElement, string>();
  const texts = new Map<Text, { before: string; after: string }>();
  const refresh = () => {
    for (const anchor of root.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')) {
      const current = anchor.getAttribute("href") ?? "";
      if (!plan.matches(current)) continue;
      if (current !== plan.href) {
        if (!links.has(anchor)) links.set(anchor, current);
        anchor.setAttribute("href", plan.href);
      }
      const walker = root.createTreeWalker(anchor, 4); // SHOW_TEXT, including nested labels; preserve icons.
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const next = plan.replaceText(text.data);
        if (next !== text.data) {
          texts.set(text, { before: text.data, after: next });
          text.data = next;
        }
      }
    }
  };
  refresh();
  const observer = new MutationObserver(refresh);
  observer.observe(root.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href"] });
  return () => {
    observer.disconnect();
    for (const [anchor, before] of links) if (anchor.getAttribute("href") === plan.href) anchor.setAttribute("href", before);
    for (const [text, change] of texts) if (text.data === change.after) text.data = change.before;
  };
}
