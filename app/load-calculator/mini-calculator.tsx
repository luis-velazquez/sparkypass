"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { haptic } from "@/lib/haptics";
import {
  ArrowRight,
  Delete,
  Equal,
  Plus,
  Minus,
  X,
  Divide,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryEntry {
  expression: string;
  result: string;
}

// Map keyboard keys to button IDs for visual feedback
const KEY_TO_BUTTON: Record<string, string> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "+", "-": "-", "*": "\u00d7", "/": "\u00f7",
  "Enter": "=", "=": "=", "Backspace": "del", "Escape": "c", "c": "c", "C": "c",
};

export function MiniCalculator({ onResult }: { onResult: (value: string) => void }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeKeyTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const inputDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === "0" ? digit : prev + digit;
    });
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev.includes(".") ? prev : prev + ".");
    }
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory([]);
  }, []);

  const deleteChar = useCallback(() => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  }, []);

  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = currentValue;

      switch (operation) {
        case "+": result = currentValue + inputValue; break;
        case "-": result = currentValue - inputValue; break;
        case "\u00d7": result = currentValue * inputValue; break;
        case "\u00f7": result = currentValue / inputValue; break;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);

  const calculate = useCallback(() => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result = previousValue;

    switch (operation) {
      case "+": result = previousValue + inputValue; break;
      case "-": result = previousValue - inputValue; break;
      case "\u00d7": result = previousValue * inputValue; break;
      case "\u00f7": result = previousValue / inputValue; break;
    }

    const rounded = Math.round(result * 100) / 100;
    const expression = `${previousValue.toLocaleString()} ${operation} ${inputValue.toLocaleString()}`;
    const resultStr = rounded.toLocaleString();

    setHistory(prev => [...prev.slice(-4), { expression, result: resultStr }]);
    setDisplay(String(rounded));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [display, previousValue, operation]);

  const flashKey = useCallback((buttonId: string) => {
    setActiveKey(buttonId);
    if (activeKeyTimer.current) clearTimeout(activeKeyTimer.current);
    activeKeyTimer.current = setTimeout(() => setActiveKey(null), 120);
  }, []);

  // Keyboard support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const buttonId = KEY_TO_BUTTON[e.key];
      if (buttonId) flashKey(buttonId);

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        performOperation("+");
      } else if (e.key === "-") {
        e.preventDefault();
        performOperation("-");
      } else if (e.key === "*") {
        e.preventDefault();
        performOperation("\u00d7");
      } else if (e.key === "/") {
        e.preventDefault();
        performOperation("\u00f7");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        calculate();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteChar();
      } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        clear();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, calculate, deleteChar, clear, flashKey]);

  const displayValue = isNaN(parseFloat(display)) ? display : parseFloat(display).toLocaleString();
  const isZeroOrInvalid = display === "0" || isNaN(parseFloat(display));

  const CalcButton = ({ children, onClick, className = "", buttonId }: { children: React.ReactNode; onClick: () => void; className?: string; buttonId?: string }) => (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { haptic("tap"); onClick(); containerRef.current?.focus(); }}
      className={`h-11 rounded-lg text-base font-medium transition-all flex items-center justify-center active:scale-95 ${
        buttonId && activeKey === buttonId ? "scale-95 ring-2 ring-amber brightness-125" : ""
      } ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="p-3 rounded-xl outline-none"
    >
      {/* History */}
      {history.length > 0 && (
        <div className="space-y-0.5 max-h-20 overflow-y-auto mb-2">
          {history.map((entry, i) => (
            <div
              key={i}
              className="text-xs font-mono text-muted-foreground text-right truncate"
              style={{ opacity: 0.4 + (i / history.length) * 0.6 }}
            >
              {entry.expression} = {entry.result}
            </div>
          ))}
        </div>
      )}

      {/* Display */}
      <div className={`rounded-xl border p-4 text-right transition-colors mb-3 ${
        isFocused ? "bg-amber/5 border-amber/20" : "bg-muted border-transparent"
      }`}>
        <div className="text-xs text-muted-foreground h-4">
          {previousValue !== null && `${previousValue.toLocaleString()} ${operation || ""}`}
        </div>
        <div className="text-3xl font-mono text-foreground truncate">
          {displayValue}
          {isFocused && <span className="animate-pulse text-amber ml-0.5">|</span>}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <CalcButton onClick={clear} buttonId="c" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">C</CalcButton>
        <CalcButton onClick={deleteChar} buttonId="del" className="bg-muted hover:bg-muted/80">
          <Delete className="h-4 w-4" />
        </CalcButton>
        <CalcButton onClick={() => performOperation("\u00f7")} buttonId={"\u00f7"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <Divide className="h-4 w-4" />
        </CalcButton>
        <CalcButton onClick={() => performOperation("\u00d7")} buttonId={"\u00d7"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <X className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("7")} buttonId="7" className="bg-muted hover:bg-muted/80">7</CalcButton>
        <CalcButton onClick={() => inputDigit("8")} buttonId="8" className="bg-muted hover:bg-muted/80">8</CalcButton>
        <CalcButton onClick={() => inputDigit("9")} buttonId="9" className="bg-muted hover:bg-muted/80">9</CalcButton>
        <CalcButton onClick={() => performOperation("-")} buttonId="-" className="bg-amber/15 text-amber hover:bg-amber/25">
          <Minus className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("4")} buttonId="4" className="bg-muted hover:bg-muted/80">4</CalcButton>
        <CalcButton onClick={() => inputDigit("5")} buttonId="5" className="bg-muted hover:bg-muted/80">5</CalcButton>
        <CalcButton onClick={() => inputDigit("6")} buttonId="6" className="bg-muted hover:bg-muted/80">6</CalcButton>
        <CalcButton onClick={() => performOperation("+")} buttonId="+" className="bg-amber/15 text-amber hover:bg-amber/25">
          <Plus className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("1")} buttonId="1" className="bg-muted hover:bg-muted/80">1</CalcButton>
        <CalcButton onClick={() => inputDigit("2")} buttonId="2" className="bg-muted hover:bg-muted/80">2</CalcButton>
        <CalcButton onClick={() => inputDigit("3")} buttonId="3" className="bg-muted hover:bg-muted/80">3</CalcButton>
        <CalcButton onClick={calculate} buttonId="=" className="bg-emerald/15 text-emerald hover:bg-emerald/25 row-span-2">
          <Equal className="h-5 w-5" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("0")} buttonId="0" className="bg-muted hover:bg-muted/80 col-span-2">0</CalcButton>
        <CalcButton onClick={inputDecimal} buttonId="." className="bg-muted hover:bg-muted/80">.</CalcButton>
      </div>

      {/* Use Result Button */}
      <Button
        onClick={() => onResult(display)}
        variant={isZeroOrInvalid ? "outline" : "default"}
        size="sm"
        disabled={isZeroOrInvalid}
        className={`w-full mt-3 ${
          isZeroOrInvalid
            ? "border-muted text-muted-foreground disabled:opacity-40"
            : "bg-emerald hover:bg-emerald/90 text-white"
        }`}
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        {isZeroOrInvalid ? "Use This Answer" : `Use ${displayValue}`}
      </Button>
    </div>
  );
}
