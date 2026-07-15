/* 골라담기 옵션 UI에서 공통으로 쓰는 작은 순수 유틸 모음.
 * - PRICE_RE: 옵션 텍스트 안의 (+1,000원) 같은 추가금액 패턴
 * - txt: DOM 요소의 textContent를 안전하게 trim
 * - comma: 숫자를 한국식 콤마 문자열로 변환
 * - baseOf: 30개입_1 같은 옵션명에서 suffix를 제거
 * - unitCountOf: 30개입 같은 이름에서 개수 숫자를 추출
 * - esc: HTML 문자열 삽입 전 특수문자 escape
 */
(function () {
  "use strict";

  const PO = (window.PickOption = window.PickOption || {});

  PO.utils = {
    PRICE_RE: /\(\s*([+\-])?\s*([\d,]+)\s*원\s*\)/,

    txt(el: Element | null): string {
      return ((el && el.textContent) || "").trim();
    },

    comma(n: number): string {
      return (n || 0).toLocaleString("ko-KR");
    },

    baseOf(name: string): string {
      const match = name.match(/^(.+)_(\d+)$/);
      return match ? match[1] : name;
    },

    unitCountOf(base: string): number {
      const match = base.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    },

    esc(value: unknown): string {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
  };
})();
