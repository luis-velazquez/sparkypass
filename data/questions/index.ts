import boxFillApprentice from "./box-fill/apprentice.json";
import boxFillJourneyman from "./box-fill/journeyman.json";
import boxFillMaster from "./box-fill/master.json";

import chapter9TablesApprentice from "./chapter-9-tables/apprentice.json";
import chapter9TablesJourneyman from "./chapter-9-tables/journeyman.json";
import chapter9TablesMaster from "./chapter-9-tables/master.json";

import conduitFillApprentice from "./conduit-fill/apprentice.json";
import conduitFillJourneyman from "./conduit-fill/journeyman.json";
import conduitFillMaster from "./conduit-fill/master.json";

import groundingBondingApprentice from "./grounding-bonding/apprentice.json";
import groundingBondingJourneyman from "./grounding-bonding/journeyman.json";
import groundingBondingMaster from "./grounding-bonding/master.json";

import loadCalculationsApprentice from "./load-calculations/apprentice.json";
import loadCalculationsJourneyman from "./load-calculations/journeyman.json";
import loadCalculationsMaster from "./load-calculations/master.json";

import mobileHomesApprentice from "./mobile-homes/apprentice.json";
import mobileHomesJourneyman from "./mobile-homes/journeyman.json";
import mobileHomesMaster from "./mobile-homes/master.json";

import motorCalculationsApprentice from "./motor-calculations/apprentice.json";
import motorCalculationsJourneyman from "./motor-calculations/journeyman.json";
import motorCalculationsMaster from "./motor-calculations/master.json";

import resistanceApprentice from "./resistance/apprentice.json";
import resistanceJourneyman from "./resistance/journeyman.json";
import resistanceMaster from "./resistance/master.json";

import servicesApprentice from "./services/apprentice.json";
import servicesJourneyman from "./services/journeyman.json";
import servicesMaster from "./services/master.json";

import swimmingPoolsApprentice from "./swimming-pools/apprentice.json";
import swimmingPoolsJourneyman from "./swimming-pools/journeyman.json";
import swimmingPoolsMaster from "./swimming-pools/master.json";

import temperatureCorrectionApprentice from "./temperature-correction/apprentice.json";
import temperatureCorrectionJourneyman from "./temperature-correction/journeyman.json";
import temperatureCorrectionMaster from "./temperature-correction/master.json";

import terminationDeratingMaster from "./termination-derating/master.json";

import textbookNavigationApprentice from "./textbook-navigation/apprentice.json";
import textbookNavigationJourneyman from "./textbook-navigation/journeyman.json";
import textbookNavigationMaster from "./textbook-navigation/master.json";

import transformerSizingApprentice from "./transformer-sizing/apprentice.json";
import transformerSizingJourneyman from "./transformer-sizing/journeyman.json";
import transformerSizingMaster from "./transformer-sizing/master.json";

import voltageDropApprentice from "./voltage-drop/apprentice.json";
import voltageDropJourneyman from "./voltage-drop/journeyman.json";
import voltageDropMaster from "./voltage-drop/master.json";

import type { Question } from "@/types/question";

export const questions: Question[] = [
  ...(boxFillApprentice as Question[]),
  ...(boxFillJourneyman as Question[]),
  ...(boxFillMaster as Question[]),

  ...(chapter9TablesApprentice as Question[]),
  ...(chapter9TablesJourneyman as Question[]),
  ...(chapter9TablesMaster as Question[]),

  ...(conduitFillApprentice as Question[]),
  ...(conduitFillJourneyman as Question[]),
  ...(conduitFillMaster as Question[]),

  ...(groundingBondingApprentice as Question[]),
  ...(groundingBondingJourneyman as Question[]),
  ...(groundingBondingMaster as Question[]),

  ...(loadCalculationsApprentice as Question[]),
  ...(loadCalculationsJourneyman as Question[]),
  ...(loadCalculationsMaster as Question[]),

  ...(mobileHomesApprentice as Question[]),
  ...(mobileHomesJourneyman as Question[]),
  ...(mobileHomesMaster as Question[]),

  ...(motorCalculationsApprentice as Question[]),
  ...(motorCalculationsJourneyman as Question[]),
  ...(motorCalculationsMaster as Question[]),

  ...(resistanceApprentice as Question[]),
  ...(resistanceJourneyman as Question[]),
  ...(resistanceMaster as Question[]),

  ...(servicesApprentice as Question[]),
  ...(servicesJourneyman as Question[]),
  ...(servicesMaster as Question[]),

  ...(swimmingPoolsApprentice as Question[]),
  ...(swimmingPoolsJourneyman as Question[]),
  ...(swimmingPoolsMaster as Question[]),

  ...(temperatureCorrectionApprentice as Question[]),
  ...(temperatureCorrectionJourneyman as Question[]),
  ...(temperatureCorrectionMaster as Question[]),

  ...(terminationDeratingMaster as Question[]),

  ...(textbookNavigationApprentice as Question[]),
  ...(textbookNavigationJourneyman as Question[]),
  ...(textbookNavigationMaster as Question[]),

  ...(transformerSizingApprentice as Question[]),
  ...(transformerSizingJourneyman as Question[]),
  ...(transformerSizingMaster as Question[]),

  ...(voltageDropApprentice as Question[]),
  ...(voltageDropJourneyman as Question[]),
  ...(voltageDropMaster as Question[]),
];
