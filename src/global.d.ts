interface Window {
  PICK_OPTION_CONFIG?: PickOptionConfig;
  PickOption?: PickOptionNamespace;
  jQuery?: (el: Element) => { trigger(eventName: string): void };
}

interface PickOptionConfig {
  title?: string;
  cards?: Record<string, PickOptionCardConfig>;
  showUnitPrice?: boolean;
  textRemain?: string;
  textMaxed?: string;
  fallbackBasePrice?: number;
}

interface PickOptionCardConfig {
  badge?: string;
  badgeTone?: "orange" | "red" | string;
  desc?: string;
  originalPrice?: number;
  discountRate?: number;
}

interface PickOptionSlot {
  name: string;
  value: string;
  ord: number;
}

interface PickOptionGroup {
  base: string;
  slots: PickOptionSlot[];
  addPrice: number;
}

interface PickOptionCounts {
  [base: string]: { n: number; used: Record<string, boolean> };
}

interface PickOptionUtils {
  PRICE_RE: RegExp;
  txt(el: Element | null): string;
  comma(n: number): string;
  baseOf(name: string): string;
  unitCountOf(base: string): number;
  esc(value: unknown): string;
}

interface PickOptionCafe24Adapter {
  findSelect(): HTMLSelectElement | null;
  findListRoot(): Element | null;
  findBasePrice(fallbackBasePrice?: number): number;
  parseGroups(selectEl: HTMLSelectElement | null): PickOptionGroup[];
  readCounts(listRoot: Element | null): PickOptionCounts;
  triggerNative(slot: PickOptionSlot, selectEl: HTMLSelectElement | null): boolean;
}

interface PickOptionNamespace {
  utils?: PickOptionUtils;
  cafe24?: PickOptionCafe24Adapter;
}
