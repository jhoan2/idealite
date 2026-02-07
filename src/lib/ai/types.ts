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

export type SymbolTechnique = "phonetic" | "semantic" | "numeric" | "pao";

export type SceneStructure = "sequence" | "panorama" | "snapshot";

export interface SceneCharacter {
  symbol: string;
  represents: string;
  technique: SymbolTechnique;
  reasoning: string;
  placement: string;
}

export interface SceneCard {
  scene_title: string;
  structure: SceneStructure;
  setting: string;
  characters: SceneCharacter[];
  narrative: string;
}

export interface GenerateScenesResponse {
  scenes: SceneCard[];
}
