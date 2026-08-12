
import type { Plant } from "@/data/dashboard";

import { PlantCard } from "./PlantCard";

type PlantPortfolioProps = {
  plants: Plant[];
};

export function PlantPortfolio({ plants }: PlantPortfolioProps) {
  return (
    <section aria-label="Your plants">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Your Plants
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Portfolio assets and live operating status
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plants.map((plant, index) => (
          <PlantCard key={plant.id} plant={plant} index={index} />
        ))}
      </div>
    </section>
  );
}
