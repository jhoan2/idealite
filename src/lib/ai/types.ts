export interface SROFact {
  id: number;
  subject: string;
  relation: string;
  object: string;
  value_type: string;
  reasoning: string;
}

export interface StructuredNotesResponse {
  structuredOutline: string;
  facts: SROFact[];
}

export type SymbolTechnique = "phonetic" | "semantic" | "pao" | "cultural" | "spatial";

export interface FactPair {
  pair_id: number;
  fact: string;
  component_a: string;
  component_b: string;
}

export interface StickerAssociation {
  pair_id: number;
  component_a: {
    label: string;
    symbol: string;
    technique: SymbolTechnique;
  };
  component_b: {
    label: string;
    symbol: string;
    technique: SymbolTechnique;
  };
  interaction: string;
  reasoning: string;
  image_prompt: string;
}
