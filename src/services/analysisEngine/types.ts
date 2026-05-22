import { Driver } from "./engine";

export interface ModularEngineResult {
  score: number;
  status: string;
  confidence: number;
  positiveDrivers: Driver[];
  negativeDrivers: Driver[];
  dataUsed: string[];
  dataMissing: string[];
  limits: string[];
  secureWording: string;
  trends?: {
    hrv?: "up" | "down" | "stable";
    recovery?: "improving" | "declining" | "stable";
  };
}
