import boxFill from "./box-fill.json";
import groundingBonding from "./grounding-bonding.json";
import loadCalculations from "./calculations-and-theory.json";
import motorCalculations from "./motors-and-generators.json";
import services from "./services.json";
import specialCode from "./special-occupancies.json";
import transformerSizing from "./transformer-sizing.json";
import wiringMethods from "./wiring-methods.json";

import type { Question } from "@/types/question";

export const questions: Question[] = [
  ...(boxFill.apprentice as Question[]),
  ...(boxFill.journeyman as Question[]),
  ...(boxFill.master as Question[]),

  ...(groundingBonding.apprentice as Question[]),
  ...(groundingBonding.journeyman as Question[]),
  ...(groundingBonding.master as Question[]),

  ...(loadCalculations.apprentice as Question[]),
  ...(loadCalculations.journeyman as Question[]),
  ...(loadCalculations.master as Question[]),

  ...(motorCalculations.apprentice as Question[]),
  ...(motorCalculations.journeyman as Question[]),
  ...(motorCalculations.master as Question[]),

  ...(services.apprentice as Question[]),
  ...(services.journeyman as Question[]),
  ...(services.master as Question[]),

  ...(specialCode.apprentice as Question[]),
  ...(specialCode.journeyman as Question[]),
  ...(specialCode.master as Question[]),

...(transformerSizing.apprentice as Question[]),
  ...(transformerSizing.journeyman as Question[]),
  ...(transformerSizing.master as Question[]),

  ...(wiringMethods.apprentice as Question[]),
  ...(wiringMethods.journeyman as Question[]),
  ...(wiringMethods.master as Question[]),
];
