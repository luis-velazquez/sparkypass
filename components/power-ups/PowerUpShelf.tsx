"use client";

import { PowerUpCard } from "./PowerUpCard";
import { POWER_UP_LIST } from "@/lib/power-ups";
import type { PowerUpTypeValue } from "@/lib/db/schema";

interface InventoryItem {
  id: string;
  type: PowerUpTypeValue;
}

interface PowerUpShelfProps {
  wattsBalance: number;
  inventory: InventoryItem[];
  onPurchase: (type: PowerUpTypeValue) => Promise<void>;
  onActivate: (purchaseId: string) => Promise<void>;
}

export function PowerUpShelf({ wattsBalance, inventory, onPurchase, onActivate }: PowerUpShelfProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {POWER_UP_LIST.map((powerUp, index) => {
        const ownedItems = inventory.filter((i) => i.type === powerUp.type);
        const firstOwned = ownedItems[0];

        return (
          <PowerUpCard
            key={powerUp.type}
            type={powerUp.type}
            name={powerUp.name}
            description={powerUp.description}
            cost={powerUp.cost}
            duration={powerUp.duration}
            iconName={powerUp.icon}
            wattsBalance={wattsBalance}
            inventoryCount={ownedItems.length}
            onPurchase={onPurchase}
            onActivate={onActivate}
            inventoryId={firstOwned?.id}
            index={index}
          />
        );
      })}
    </div>
  );
}
