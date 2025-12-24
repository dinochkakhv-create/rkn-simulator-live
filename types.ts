
export interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Replacement {
  name: string;
  description: string;
}

export interface BanRecord {
  id: string;
  serviceName: string;
  date: string;
  reason: string;
  caseNumber: string;
  replacement?: Replacement;
}

export interface SimulationState {
  isSpinning: boolean;
  selectedService: Service | null;
  history: BanRecord[];
  isGeneratingReason: boolean;
  generatedReason: string | null;
  isGeneratingReplacement: boolean;
  generatedReplacement: Replacement | null;
}
