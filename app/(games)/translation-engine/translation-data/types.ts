export interface TranslationCard {
  id: string;
  slang: string;
  officialTerm: string;
  reference: string;
  description: string;
}

export interface TranslationPack {
  id: string;
  name: string;
  cards: TranslationCard[];
}
