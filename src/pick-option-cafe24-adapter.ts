/* 카페24 기본 옵션 DOM을 읽고, 기본 구매 흐름을 원격으로 트리거하는 어댑터.
 * - findSelect: 카페24 기본 옵션 select를 찾음
 * - findListRoot: 선택상품 목록을 감시할 루트 DOM을 찾음
 * - findBasePrice: 상품 기본 판매가를 읽음
 * - parseGroups: 옵션값을 suffix 기준으로 골라담기 그룹으로 변환
 * - readCounts: 선택상품 목록에서 현재 담긴 옵션 수를 읽음
 * - triggerNative: 카페24 기본 옵션 버튼/select를 원격 트리거
 */
(function () {
  "use strict";

  const PO = (window.PickOption = window.PickOption || {});
  const U = PO.utils;
  if (!U) return;

  PO.cafe24 = {
    findSelect(): HTMLSelectElement | null {
      return document.querySelector(
        'select[name^="option"], select[id^="product_option_id"]',
      );
    },

    findListRoot(): Element | null {
      return (
        document.querySelector("tbody.option_products") ||
        document.getElementById("totalProducts") ||
        document.querySelector('[id^="totalProducts"]')
      );
    },

    findBasePrice(fallbackBasePrice?: number): number {
      const el = document.querySelector("#span_product_price_text");
      const price = el ? parseInt(U.txt(el).replace(/[^\d]/g, ""), 10) : 0;
      return price || fallbackBasePrice || 0;
    },

    parseGroups(selectEl: HTMLSelectElement | null): PickOptionGroup[] {
      const groups: PickOptionGroup[] = [];
      const byBase: Record<string, PickOptionGroup> = {};
      if (!selectEl) return groups;

      Array.prototype.forEach.call(selectEl.options, function (option: HTMLOptionElement) {
        const code = (option.value || "").trim();
        if (!code || code === "*" || code === "**") return;

        const raw = (option.text || "").trim();
        const name = raw.replace(U.PRICE_RE, "").trim();
        if (!name) return;

        const match = name.match(/^(.+)_(\d+)$/);
        const base = match ? match[1] : name;
        if (!byBase[base]) {
          byBase[base] = { base: base, slots: [], addPrice: 0 };
          groups.push(byBase[base]);
        }

        byBase[base].slots.push({
          name: name,
          value: code,
          ord: match ? parseInt(match[2], 10) : 0,
        });

        const priceMatch = raw.match(U.PRICE_RE);
        if (priceMatch) {
          byBase[base].addPrice =
            (priceMatch[1] === "-" ? -1 : 1) *
            parseInt(priceMatch[2].replace(/,/g, ""), 10);
        }
      });

      groups.forEach(function (group) {
        group.slots.sort(function (a, b) {
          return a.ord - b.ord;
        });
      });

      return groups;
    },

    readCounts(listRoot: Element | null): PickOptionCounts {
      const counts: PickOptionCounts = {};
      if (!listRoot) return counts;

      Array.prototype.forEach.call(
        listRoot.querySelectorAll("tr.option_product"),
        function (row: Element) {
          const productName = row.querySelector(".product span");
          if (!productName) return;

          const name = U.txt(productName).replace(U.PRICE_RE, "").trim();
          const base = U.baseOf(name);
          if (!counts[base]) counts[base] = { n: 0, used: {} };
          counts[base].n++;
          counts[base].used[name] = true;
        },
      );

      return counts;
    },

    triggerNative(slot: PickOptionSlot, selectEl: HTMLSelectElement | null): boolean {
      const buttons = document.querySelectorAll(
        "li[option_value], ul[option_style] li, .ec-product-button li",
      );

      for (let i = 0; i < buttons.length; i++) {
        const optionValue = buttons[i].getAttribute("option_value");
        if (
          optionValue === slot.value ||
          optionValue === slot.name ||
          (!optionValue && U.txt(buttons[i]) === slot.name)
        ) {
          (buttons[i] as HTMLElement).click();
          return true;
        }
      }

      if (!selectEl) return false;
      selectEl.value = slot.value;
      if (selectEl.value !== slot.value) return false;

      if (window.jQuery) window.jQuery(selectEl).trigger("change");
      else selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },

    /* X로 지운 뒤에도 카페24 버튼에 선택 표시가 남는 경우가 있어
     * 목록에는 없는데 선택된 상태인 버튼만 한 번 눌러 해제한다 */
    clearStaleSelections(groups: PickOptionGroup[], listRoot: Element | null): void {
      const counts = this.readCounts(listRoot);
      const buttons = document.querySelectorAll(
        "li[option_value].ec-product-selected",
      );

      Array.prototype.forEach.call(buttons, function (button: Element) {
        const code = (button.getAttribute("option_value") || "").trim();
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          for (let j = 0; j < group.slots.length; j++) {
            const slot = group.slots[j];
            if (slot.value !== code) continue;
            const used = counts[group.base] ? counts[group.base].used : {};
            if (!used[slot.name]) (button as HTMLElement).click();
            return;
          }
        }
      });
    },
  };
})();
