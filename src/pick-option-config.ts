/* 골라담기 옵션 UI - 외부 설정 파일.
 * 이 파일의 값만 바꾸면 뱃지/설명/할인율/문구가 바뀝니다. (로직은 다른 파일이 담당)
 * cards 의 key 는 옵션값에서 suffix(_1, _2)를 뗀 이름과 일치해야 합니다. 예) "30개입_1" -> "30개입"
 * 옵션값 목록/추가금액/추가 가능 횟수는 여기 두지 않고 카페24 옵션 DOM에서 파생합니다.
 */
window.PICK_OPTION_CONFIG = {
  title: "상품 선택",

  cards: {
    "10개입": { badge: "", desc: "", originalPrice: 13000, discountRate: 25 },
    "30개입": { badge: "가장 많이 사요", badgeTone: "orange", desc: "", originalPrice: 17000, discountRate: 29 },
    "50개입": { badge: "", desc: "", originalPrice: 22000, discountRate: 32 },
    "100개입": { badge: "최대할인", badgeTone: "red", desc: "", originalPrice: 32000, discountRate: 41 },
  },

  showUnitPrice: true,
  textRemain: "{n}/{max} 담김 · {left}회 더 가능",
  textMaxed: "{n}/{max} 담김 · 최대",
  fallbackBasePrice: 10000,
};
