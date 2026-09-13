import {
  PLANT_PRODUCT_IDS,
  PLANT_PRODUCTS,
  emptyProductValues,
  productById,
  type PlantProductId,
  type ProductStatus,
} from "@/lib/plantProducts";

export type DataEntryState = {
  /** Form values keyed by product id. */
  values: Partial<Record<PlantProductId, Record<string, string>>>;
  /** Products the user may open (progressive unlock). */
  unlocked: PlantProductId[];
  /** Products whose intake is finished — they “run”. */
  completed: PlantProductId[];
  /** Twin wizard finished for 8A. */
  twinComplete: boolean;
  activeProductId: PlantProductId;
};

const STORAGE_PREFIX = "alcaster.data-entry.";

function storageKey(plantId: string) {
  return `${STORAGE_PREFIX}${plantId}`;
}

export function defaultDataEntryState(): DataEntryState {
  const values: DataEntryState["values"] = {};
  for (const product of PLANT_PRODUCTS) {
    values[product.id] = emptyProductValues(product);
  }
  return {
    values,
    unlocked: ["dashboard"],
    completed: [],
    twinComplete: false,
    activeProductId: "dashboard",
  };
}

export function readDataEntryState(plantId: string): DataEntryState | null {
  try {
    const raw = localStorage.getItem(storageKey(plantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DataEntryState>;
    const base = defaultDataEntryState();
    return {
      values: { ...base.values, ...parsed.values },
      unlocked: Array.from(
        new Set(["dashboard", ...(parsed.unlocked ?? [])]),
      ) as PlantProductId[],
      completed: (parsed.completed ?? []).filter((id): id is PlantProductId =>
        PLANT_PRODUCT_IDS.includes(id),
      ),
      twinComplete: Boolean(parsed.twinComplete),
      activeProductId: PLANT_PRODUCT_IDS.includes(
        parsed.activeProductId as PlantProductId,
      )
        ? (parsed.activeProductId as PlantProductId)
        : "dashboard",
    };
  } catch {
    return null;
  }
}

export function writeDataEntryState(plantId: string, state: DataEntryState) {
  localStorage.setItem(storageKey(plantId), JSON.stringify(state));
}

export function clearDataEntryState(plantId: string) {
  localStorage.removeItem(storageKey(plantId));
}

/** Seed CMS/dashboard defaults from plant create fields. */
export function seedFromPlant(input: {
  operatorName?: string;
  capacityMw?: number;
}): Record<string, string> {
  return {
    operatorName: input.operatorName ?? "",
    timezone: "Asia/Kolkata",
    reportingCurrency: "INR",
    expectedAnnualGenerationMwh:
      input.capacityMw != null
        ? String(Math.round(input.capacityMw * 1600))
        : "",
    performanceRatioTarget: "80",
  };
}

export function productStatus(
  state: DataEntryState,
  id: PlantProductId,
): ProductStatus {
  if (isProductComplete(state, id)) return "running";
  if (state.unlocked.includes(id)) return "available";
  return "locked";
}

export function isProductComplete(
  state: DataEntryState,
  id: PlantProductId,
): boolean {
  if (id === "dt-normal") {
    return (
      state.completed.includes(id) ||
      (state.twinComplete && state.unlocked.includes("dt-normal"))
    );
  }
  return state.completed.includes(id);
}

export function runningCount(state: DataEntryState): number {
  return PLANT_PRODUCT_IDS.filter((id) => isProductComplete(state, id)).length;
}

export function overallProgress(state: DataEntryState): number {
  const total = PLANT_PRODUCT_IDS.length;
  const done = PLANT_PRODUCT_IDS.filter((id) => isProductComplete(state, id))
    .length;
  return Math.round((done / total) * 100);
}

export function markProductComplete(
  state: DataEntryState,
  id: PlantProductId,
): DataEntryState {
  const completed = Array.from(new Set([...state.completed, id]));
  const index = PLANT_PRODUCT_IDS.indexOf(id);
  const unlocked = [...state.unlocked];
  const next = PLANT_PRODUCT_IDS[index + 1];
  if (next && !unlocked.includes(next)) unlocked.push(next);

  return {
    ...state,
    completed,
    unlocked,
    twinComplete: id === "dt-normal" ? true : state.twinComplete,
    activeProductId: next ?? id,
  };
}

export function getProductValues(
  state: DataEntryState,
  id: PlantProductId,
): Record<string, string> {
  const product = productById(id);
  return {
    ...emptyProductValues(product),
    ...(state.values[id] ?? {}),
  };
}
