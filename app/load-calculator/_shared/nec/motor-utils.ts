// Motor utility functions - dispatches between single-phase and three-phase tables

import { getMotorAmps } from "./res-motor-flc";
import { getMotorAmps3Phase } from "./3-phase-motor-flc";

// Get FLC for any motor (dispatches by phase)
export function getMotorFLC(motor: { horsepower: number; voltage: number; phase: 1 | 3 }): number {
  if (motor.phase === 3) {
    return getMotorAmps3Phase(motor.horsepower, motor.voltage);
  }
  // Single-phase: 120->115V column, 208/240->230V column (Table 430.248)
  const lookupVoltage: 120 | 240 = motor.voltage <= 120 ? 120 : 240;
  return getMotorAmps(motor.horsepower, lookupVoltage);
}

// Convert motor to VA (handles single-phase and three-phase)
export function motorToVA(motor: { horsepower: number; voltage: number; phase: 1 | 3 }): number {
  const flc = getMotorFLC(motor);
  if (motor.phase === 3) {
    return Math.round(flc * motor.voltage * Math.sqrt(3));
  }
  return Math.round(flc * motor.voltage);
}

// Get motor table reference info for display
export function getMotorTableInfo(motor: { voltage: number; phase: 1 | 3 }): { tableNum: string; tableCol: string } {
  if (motor.phase === 3) {
    return { tableNum: "430.250", tableCol: motor.voltage <= 208 ? "208V" : "230V" };
  }
  return { tableNum: "430.248", tableCol: motor.voltage <= 120 ? "115V" : "230V" };
}
