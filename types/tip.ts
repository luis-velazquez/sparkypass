export interface TipContentStructured {
  question: string;
  breakdown: { point: string; detail: string }[];
  bottomLine: string;
  theTrap?: { title: string; detail: string };
}

export interface Tip {
  id: string;
  type: string;
  title: string;
  category?: string;
  difficulty?: string;
  content: string | TipContentStructured;
  formulas?: string[];
  necReference: string;
  sparkyBottomLine?: string;
}
