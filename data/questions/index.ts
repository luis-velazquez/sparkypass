import boxFill from "./box-fill.json";
import chapter9Tables from "./chapter-9-tables.json";
import conduitFill from "./conduit-fill.json";
import groundingBonding from "./grounding-bonding.json";
import loadCalculations from "./load-calculations.json";
import mobileHomes from "./mobile-homes.json";
import motorCalculations from "./motor-calculations.json";
import resistance from "./resistance.json";
import services from "./services.json";
import swimmingPools from "./swimming-pools.json";
import temperatureCorrection from "./temperature-correction.json";
import terminationDerating from "./termination-derating.json";
import textbookNavigation from "./textbook-navigation.json";
import transformerSizing from "./transformer-sizing.json";
import voltageDrop from "./voltage-drop.json";

import type { Question } from "@/types/question";

export const questions: Question[] = [
  ...(boxFill.apprentice as Question[]),
  ...(boxFill.journeyman as Question[]),
  ...(boxFill.master as Question[]),

  ...(chapter9Tables.apprentice as Question[]),
  ...(chapter9Tables.journeyman as Question[]),
  ...(chapter9Tables.master as Question[]),

  ...(conduitFill.apprentice as Question[]),
  ...(conduitFill.journeyman as Question[]),
  ...(conduitFill.master as Question[]),

  ...(groundingBonding.apprentice as Question[]),
  ...(groundingBonding.journeyman as Question[]),
  ...(groundingBonding.master as Question[]),

  ...(loadCalculations.apprentice as Question[]),
  ...(loadCalculations.journeyman as Question[]),
  ...(loadCalculations.master as Question[]),

  ...(mobileHomes.apprentice as Question[]),
  ...(mobileHomes.journeyman as Question[]),
  ...(mobileHomes.master as Question[]),

  ...(motorCalculations.apprentice as Question[]),
  ...(motorCalculations.journeyman as Question[]),
  ...(motorCalculations.master as Question[]),

  ...(resistance.apprentice as Question[]),
  ...(resistance.journeyman as Question[]),
  ...(resistance.master as Question[]),

  ...(services.apprentice as Question[]),
  ...(services.journeyman as Question[]),
  ...(services.master as Question[]),

  ...(swimmingPools.apprentice as Question[]),
  ...(swimmingPools.journeyman as Question[]),
  ...(swimmingPools.master as Question[]),

  ...(temperatureCorrection.apprentice as Question[]),
  ...(temperatureCorrection.journeyman as Question[]),
  ...(temperatureCorrection.master as Question[]),

  ...(terminationDerating.master as Question[]),

  ...(textbookNavigation.apprentice as Question[]),
  ...(textbookNavigation.journeyman as Question[]),
  ...(textbookNavigation.master as Question[]),

  ...(transformerSizing.apprentice as Question[]),
  ...(transformerSizing.journeyman as Question[]),
  ...(transformerSizing.master as Question[]),

  ...(voltageDrop.apprentice as Question[]),
  ...(voltageDrop.journeyman as Question[]),
  ...(voltageDrop.master as Question[]),
];
