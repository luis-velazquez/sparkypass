// General Code (Chapters 1–4)
import boxFill from "./general-code/box-fill.json";
import groundingBonding from "./general-code/grounding-bonding.json";
import loadCalculations from "./general-code/load-calculations.json";
import motorCalculations from "./general-code/motor-calculations.json";
import services from "./general-code/services.json";
import temperatureCorrection from "./general-code/temperature-correction.json";
import terminationDerating from "./general-code/termination-derating.json";
import textbookNavigation from "./general-code/textbook-navigation.json";
import transformerSizing from "./general-code/transformer-sizing.json";

// Tables (Chapter 9)
import chapter9Tables from "./tables/chapter-9-tables.json";
import conduitFill from "./tables/conduit-fill.json";
import resistance from "./tables/resistance.json";
import voltageDrop from "./tables/voltage-drop.json";

// Special Code (Chapters 5–7)
import mobileHomes from "./special-code/mobile-homes.json";
import swimmingPools from "./special-code/swimming-pools.json";

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
