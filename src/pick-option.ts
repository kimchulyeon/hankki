/* 골라담기 옵션 UI를 렌더링하고 카페24 옵션 상태와 동기화하는 메인 파일.
 * PC/모바일 모두 옵션 영역에 카드를 바로 노출한다. (좁은 폭에서는 CSS로 카드 배치만 조정)
 * - _lock / _unlock: 옵션 추가 중 반복 클릭 잠금
 * - _rowHTML: 옵션 그룹 1개를 카드 HTML로 변환
 * - _render: 전체 골라담기 UI를 다시 그림
 * - _addOption: 다음 미사용 slot을 찾아 카페24 기본 옵션을 트리거
 * - _onActivate: 클릭/키보드 선택 이벤트를 처리
 * - _bindEvents: 이벤트 위임과 MutationObserver를 연결
 * - _init: 필요한 DOM이 준비될 때까지 기다렸다가 초기화
 */
(function () {
  "use strict";

  const CFG = window.PICK_OPTION_CONFIG || {};
  const PO = window.PickOption || {};
  const U = PO.utils;
  const C24 = PO.cafe24;
  const AREA_ID = "pickOptionArea";

  let area: HTMLElement | null = null;
  let selectEl: HTMLSelectElement | null = null;
  let listRoot: Element | null = null;
  let groups: PickOptionGroup[] = [];
  let basePrice = 0;
  let busy = false;
  let busyTimer: ReturnType<typeof setTimeout> | null = null;
  let tries = 0;

  function _lock(): void {
    busy = true;
    if (busyTimer) clearTimeout(busyTimer);
    busyTimer = setTimeout(_unlock, 1200);
  }

  function _unlock(): void {
    busy = false;
    if (busyTimer) clearTimeout(busyTimer);
  }

  function _rowHTML(group: PickOptionGroup, counts: PickOptionCounts): string {
    if (!U) return "";

    const cardConfig = (CFG.cards || {})[group.base] || {};
    const current = counts[group.base] ? counts[group.base].n : 0;
    const max = group.slots.length;
    const isMaxed = current >= max;
    const isSelected = current > 0;
    const price = basePrice + group.addPrice;

    let discount = "";
    if (cardConfig.discountRate) {
      discount =
        ' <em class="pick-row__dc">(' +
        cardConfig.discountRate +
        "% 할인)</em>";
    } else if (cardConfig.originalPrice && cardConfig.originalPrice > price) {
      discount =
        ' <em class="pick-row__dc">(' +
        Math.round((1 - price / cardConfig.originalPrice) * 100) +
        "% 할인)</em>";
    }

    let subText = "";
    if (isSelected) {
      subText = (isMaxed
        ? CFG.textMaxed || "{n}/{max} 담김 · 최대"
        : CFG.textRemain || "{n}/{max} 담김 · {left}회 더 가능")
        .replace("{n}", String(current))
        .replace("{max}", String(max))
        .replace("{left}", String(max - current));
    } else if (cardConfig.desc) {
      subText = U.esc(cardConfig.desc);
    } else if (CFG.showUnitPrice !== false && U.unitCountOf(group.base) > 0) {
      subText =
        "1개 : " + U.comma(Math.round(price / U.unitCountOf(group.base))) + "원";
    }

    return (
      '<li class="pick-row' +
      (isSelected ? " is-selected" : "") +
      (isMaxed ? " is-maxed" : "") +
      '" data-base="' +
      U.esc(group.base) +
      '" role="button" tabindex="0" aria-disabled="' +
      isMaxed +
      '">' +
      '<span class="pick-row__radio" aria-hidden="true"></span>' +
      '<span class="pick-row__name">' +
      U.esc(group.base) +
      "</span>" +
      '<span class="pick-row__priceWrap">' +
      '<span class="pick-row__price">' +
      U.comma(price) +
      "원" +
      discount +
      (cardConfig.badge
        ? ' <em class="pick-row__badge' +
          (cardConfig.badgeTone === "red" ? " pick-row__badge--red" : "") +
          '">' +
          U.esc(cardConfig.badge) +
          "</em>"
        : "") +
      "</span>" +
      (subText
        ? '<span class="pick-row__sub' +
          (isSelected ? " is-accent" : "") +
          '">' +
          subText +
          "</span>"
        : "") +
      "</span>" +
      "</li>"
    );
  }

  function _render(): void {
    if (!area || !C24 || !U) return;

    const counts = C24.readCounts(listRoot);
    area.innerHTML =
      '<div class="pick-panel">' +
      (CFG.title
        ? '<div class="pick-panel__head">' + U.esc(CFG.title) + "</div>"
        : "") +
      '<ul class="pick-panel__list">' +
      groups.map(function (group) { return _rowHTML(group, counts); }).join("") +
      "</ul></div>";
  }

  function _addOption(base: string): void {
    if (busy || !C24) return;

    const group = groups.filter(function (item) { return item.base === base; })[0];
    if (!group) return;

    const counts = C24.readCounts(listRoot);
    const used = counts[base] ? counts[base].used : {};
    const slot = group.slots.filter(function (item) { return !used[item.name]; })[0];
    if (!slot) return;

    _lock();
    if (!C24.triggerNative(slot, selectEl)) _unlock();
  }

  function _onActivate(event: Event): void {
    const target = event.target as Element | null;
    const row = target && target.closest ? target.closest(".pick-row") : null;
    if (!row || row.classList.contains("is-maxed")) return;
    _addOption(row.getAttribute("data-base") || "");
  }

  function _bindEvents(): void {
    if (!area || !listRoot) return;

    area.addEventListener("click", _onActivate);
    area.addEventListener("keydown", function (event) {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        _onActivate(keyboardEvent);
      }
    });

    new MutationObserver(function () {
      _unlock();
      _render();
      /* X 삭제 후 남아 있을 수 있는 기본 옵션 선택 상태 정리 */
      setTimeout(function () {
        if (C24) C24.clearStaleSelections(groups, listRoot);
      }, 50);
    }).observe(listRoot, { childList: true, subtree: true });
  }

  function _init(): void {
    if (!U || !C24) {
      if (++tries < 20) setTimeout(_init, 250);
      return;
    }

    area = document.getElementById(AREA_ID);
    selectEl = C24.findSelect();
    listRoot = C24.findListRoot();

    if (!area || !selectEl || !listRoot) {
      if (++tries < 20) setTimeout(_init, 250);
      return;
    }

    basePrice = C24.findBasePrice(CFG.fallbackBasePrice);
    groups = C24.parseGroups(selectEl);
    if (!groups.length) return;

    _render();
    _bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init);
  } else {
    _init();
  }
})();
