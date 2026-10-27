export type SniperDeck = "everyday-carry" | "code-math";

export interface SniperCard {
  id: string;
  term: string;
  reference: string;
  description: string;
  deck: SniperDeck;
}

export interface SniperPack {
  id: string;
  name: string;
  cards: SniperCard[];
}
