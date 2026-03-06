"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { haptic } from "@/lib/haptics";
import { evaluateExpression, autoCloseParens } from "@/lib/evaluate-expression";
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

const OPERATORS = ["+", "−", "×", "÷"];
const KEY_TO_BUTTON: Record<string, string> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "+", "-": "−", "*": "×", "/": "÷",
  "(": "(", ")": ")",
  "Enter": "=", "=": "=", "Backspace": "del", "Escape": "c", "c": "c", "C": "c",
};

function CalcButton({ children, onClick, className = "", isActive }: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-11 rounded-lg text-base font-medium transition-all flex items-center justify-center active:scale-95 ${
        isActive ? "scale-95 ring-2 ring-amber brightness-125" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function MiniCalculator({ onResult }: { onResult: (value: string) => void }) {
  // Expression tokens committed so far, e.g. ["(", "2", "+", "3", ")", "×"]
  const [expression, setExpression] = useState<string[]>([]);
  // Number currently being typed (not yet committed)
  const [currentNumber, setCurrentNumber] = useState("");
  // True after pressing = (next input starts a new expression)
  const [evaluated, setEvaluated] = useState(false);
  // Persists after = until C is pressed — the raw number and the formula that produced it
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastExpression, setLastExpression] = useState("");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeKeyTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Build the full expression string for display and evaluation
  const fullExpression = useMemo(() => {
    const parts = [...expression];
    if (currentNumber) parts.push(currentNumber);
    return parts.join(" ");
  }, [expression, currentNumber]);

  // Count unmatched open parens
  const openParenCount = useMemo(() => {
    let count = 0;
    for (const tok of expression) {
      if (tok === "(") count++;
      else if (tok === ")") count--;
    }
    return count;
  }, [expression]);

  // Last committed token
  const lastToken = expression[expression.length - 1];

  const startFresh = useCallback(() => {
    setExpression([]);
    setCurrentNumber("");
    setEvaluated(false);
  }, []);

  const inputDigit = useCallback((digit: string) => {
    if (evaluated) {
      startFresh();
      setCurrentNumber(digit);
      return;
    }
    // If last token is ')' insert implicit ×
    if (!currentNumber && lastToken === ")") {
      setExpression(prev => [...prev, "×"]);
    }
    setCurrentNumber(prev => prev === "0" ? digit : prev + digit);
  }, [evaluated, currentNumber, lastToken, startFresh]);

  const inputTripleZero = useCallback(() => {
    if (evaluated) {
      startFresh();
      setCurrentNumber("0");
      return;
    }
    if (!currentNumber && lastToken === ")") {
      setExpression(prev => [...prev, "×"]);
    }
    if (!currentNumber) {
      setCurrentNumber("0");
    } else if (currentNumber === "0" || currentNumber === "-") {
      // No leading zeros
    } else {
      setCurrentNumber(prev => prev + "000");
    }
  }, [evaluated, currentNumber, lastToken, startFresh]);

  const inputDecimal = useCallback(() => {
    if (evaluated) {
      startFresh();
      setCurrentNumber("0.");
      return;
    }
    if (!currentNumber && lastToken === ")") {
      setExpression(prev => [...prev, "×"]);
    }
    if (!currentNumber) {
      setCurrentNumber("0.");
    } else if (!currentNumber.includes(".")) {
      setCurrentNumber(prev => prev + ".");
    }
  }, [evaluated, currentNumber, lastToken, startFresh]);

  const inputOperator = useCallback((op: string) => {
    if (evaluated) {
      // Chain from previous result: start new expression as [result, op]
      setExpression(lastResult ? [lastResult, op] : []);
      setCurrentNumber("");
      setEvaluated(false);
      return;
    }

    // If there's a current number, commit it first
    if (currentNumber) {
      setExpression(prev => [...prev, currentNumber, op]);
      setCurrentNumber("");
      return;
    }

    // If last token is an operator, replace it
    if (lastToken && OPERATORS.includes(lastToken)) {
      setExpression(prev => [...prev.slice(0, -1), op]);
      return;
    }

    // If last token is ')' or a number, append operator
    if (lastToken === ")" || (lastToken && !OPERATORS.includes(lastToken) && lastToken !== "(")) {
      setExpression(prev => [...prev, op]);
      return;
    }

    // At start with no number and no expression — allow unary minus only
    if (op === "−" && expression.length === 0 && !currentNumber) {
      setCurrentNumber("-");
    }
  }, [evaluated, currentNumber, lastToken, expression.length, lastResult]);

  const inputParen = useCallback((paren: "(" | ")") => {
    if (evaluated) {
      if (paren === "(") {
        startFresh();
        setExpression(["("]);
        return;
      }
      return; // ')' after evaluation makes no sense
    }

    if (paren === "(") {
      // If preceded by number or ')' insert implicit ×
      if (currentNumber) {
        setExpression(prev => [...prev, currentNumber, "×", "("]);
        setCurrentNumber("");
      } else if (lastToken === ")") {
        setExpression(prev => [...prev, "×", "("]);
      } else if (lastToken && !OPERATORS.includes(lastToken) && lastToken !== "(") {
        setExpression(prev => [...prev, "×", "("]);
      } else {
        setExpression(prev => [...prev, "("]);
      }
      return;
    }

    // paren === ")"
    if (openParenCount <= 0) return; // No unmatched '(' to close

    if (currentNumber) {
      setExpression(prev => [...prev, currentNumber, ")"]);
      setCurrentNumber("");
    } else if (lastToken && lastToken !== "(" && !OPERATORS.includes(lastToken)) {
      setExpression(prev => [...prev, ")"]);
    }
  }, [evaluated, currentNumber, lastToken, openParenCount, startFresh]);

  const calculate = useCallback(() => {
    const parts = [...expression];
    if (currentNumber) parts.push(currentNumber);
    if (parts.length === 0) return;

    const exprStr = autoCloseParens(parts.join(" "));
    const result = evaluateExpression(exprStr);

    if (result === null) return;

    const displayExpr = parts.join(" ");
    const rounded = Math.round(result * 100) / 100;
    const resultStr = isFinite(rounded) ? rounded.toLocaleString() : "Error";

    setHistory(prev => [...prev.slice(-4), { expression: displayExpr, result: resultStr }]);

    if (isFinite(rounded)) {
      setLastResult(String(rounded));
      setLastExpression(displayExpr);
      setExpression([]);
      setCurrentNumber("");
      setEvaluated(true);
    } else {
      startFresh();
    }
  }, [expression, currentNumber, startFresh]);

  const deleteChar = useCallback(() => {
    if (evaluated) {
      // After evaluation, DEL is a no-op — use C to clear
      return;
    }

    if (currentNumber) {
      // Remove last char from currentNumber
      const remaining = currentNumber.slice(0, -1);
      setCurrentNumber(remaining === "-" ? "" : remaining);
      return;
    }

    // Pop last token from expression
    if (expression.length > 0) {
      const last = expression[expression.length - 1];
      // If it's a multi-char number, remove last digit
      if (last && !OPERATORS.includes(last) && last !== "(" && last !== ")" && last.length > 1) {
        const trimmed = last.slice(0, -1);
        setExpression(prev => [...prev.slice(0, -1), trimmed]);
      } else {
        setExpression(prev => prev.slice(0, -1));
      }
    }
  }, [evaluated, currentNumber, expression, startFresh]);

  const clear = useCallback(() => {
    startFresh();
    setLastResult(null);
    setLastExpression("");
    setHistory([]);
  }, [startFresh]);

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
        inputOperator("+");
      } else if (e.key === "-") {
        e.preventDefault();
        inputOperator("−");
      } else if (e.key === "*") {
        e.preventDefault();
        inputOperator("×");
      } else if (e.key === "/") {
        e.preventDefault();
        inputOperator("÷");
      } else if (e.key === "(") {
        e.preventDefault();
        inputParen("(");
      } else if (e.key === ")") {
        e.preventDefault();
        inputParen(")");
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
  }, [inputDigit, inputDecimal, inputOperator, inputParen, calculate, deleteChar, clear, flashKey]);

  // Top line: shows the formula after pressing =
  const expressionDisplay = useMemo(() => {
    if (evaluated && lastExpression) return lastExpression + " =";
    return "\u00A0";
  }, [evaluated, lastExpression]);

  // Big number: formula while typing, answer after =
  const mainDisplay = useMemo(() => {
    if (evaluated && lastResult) {
      const val = parseFloat(lastResult);
      return isFinite(val) ? val.toLocaleString() : "Error";
    }
    if (fullExpression) return fullExpression;
    if (lastResult) {
      const val = parseFloat(lastResult);
      return isFinite(val) ? val.toLocaleString() : "0";
    }
    return "0";
  }, [evaluated, lastResult, fullExpression]);

  // "Use Result" only available after pressing =
  const displayResult = lastResult;

  const isZeroOrInvalid = !displayResult || displayResult === "0";

  const btn = useCallback((action: () => void) => {
    return () => { haptic("tap"); action(); containerRef.current?.focus(); };
  }, []);

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
      <div className={`rounded-xl border p-3 text-right transition-colors mb-3 ${
        isFocused ? "bg-amber/5 border-amber/20" : "bg-muted border-transparent"
      }`}>
        <div className="text-[10px] text-muted-foreground min-h-3.5 font-mono break-all">
          {expressionDisplay}
        </div>
        <div className="text-sm font-mono text-foreground break-all h-[4.5rem] overflow-hidden leading-snug flex items-end">
          <span className="w-full">
            {mainDisplay}
            {isFocused && <span className="animate-pulse text-amber ml-0.5">|</span>}
          </span>
        </div>
      </div>

      {/* Buttons — 5×4 grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: ( ) C DEL */}
        <CalcButton onClick={btn(() => inputParen("("))} isActive={activeKey === "("} className="bg-muted hover:bg-muted/80">(</CalcButton>
        <CalcButton onClick={btn(() => inputParen(")"))} isActive={activeKey === ")"} className="bg-muted hover:bg-muted/80">)</CalcButton>
        <CalcButton onClick={btn(clear)} isActive={activeKey === "c"} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">C</CalcButton>
        <CalcButton onClick={btn(deleteChar)} isActive={activeKey === "del"} className="bg-muted hover:bg-muted/80">
          <Delete className="h-4 w-4" />
        </CalcButton>

        {/* Row 2: 7 8 9 ÷ */}
        <CalcButton onClick={btn(() => inputDigit("7"))} isActive={activeKey === "7"} className="bg-muted hover:bg-muted/80">7</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("8"))} isActive={activeKey === "8"} className="bg-muted hover:bg-muted/80">8</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("9"))} isActive={activeKey === "9"} className="bg-muted hover:bg-muted/80">9</CalcButton>
        <CalcButton onClick={btn(() => inputOperator("÷"))} isActive={activeKey === "÷"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <Divide className="h-4 w-4" />
        </CalcButton>

        {/* Row 3: 4 5 6 × */}
        <CalcButton onClick={btn(() => inputDigit("4"))} isActive={activeKey === "4"} className="bg-muted hover:bg-muted/80">4</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("5"))} isActive={activeKey === "5"} className="bg-muted hover:bg-muted/80">5</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("6"))} isActive={activeKey === "6"} className="bg-muted hover:bg-muted/80">6</CalcButton>
        <CalcButton onClick={btn(() => inputOperator("×"))} isActive={activeKey === "×"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <X className="h-4 w-4" />
        </CalcButton>

        {/* Row 4: 1 2 3 − */}
        <CalcButton onClick={btn(() => inputDigit("1"))} isActive={activeKey === "1"} className="bg-muted hover:bg-muted/80">1</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("2"))} isActive={activeKey === "2"} className="bg-muted hover:bg-muted/80">2</CalcButton>
        <CalcButton onClick={btn(() => inputDigit("3"))} isActive={activeKey === "3"} className="bg-muted hover:bg-muted/80">3</CalcButton>
        <CalcButton onClick={btn(() => inputOperator("−"))} isActive={activeKey === "−"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <Minus className="h-4 w-4" />
        </CalcButton>

        {/* Row 5: 0 000 . + */}
        <CalcButton onClick={btn(() => inputDigit("0"))} isActive={activeKey === "0"} className="bg-muted hover:bg-muted/80">0</CalcButton>
        <CalcButton onClick={btn(inputTripleZero)} isActive={activeKey === "000"} className="bg-muted hover:bg-muted/80 text-sm">000</CalcButton>
        <CalcButton onClick={btn(inputDecimal)} isActive={activeKey === "."} className="bg-muted hover:bg-muted/80">.</CalcButton>
        <CalcButton onClick={btn(() => inputOperator("+"))} isActive={activeKey === "+"} className="bg-amber/15 text-amber hover:bg-amber/25">
          <Plus className="h-4 w-4" />
        </CalcButton>

        {/* Row 6: = (full width) */}
        <CalcButton onClick={btn(calculate)} isActive={activeKey === "="} className="col-span-4 bg-emerald/15 text-emerald hover:bg-emerald/25">
          <Equal className="h-5 w-5" />
        </CalcButton>
      </div>

      {/* Use Answer Button — always visible, greyed out until a result is ready */}
      <Button
        onClick={() => displayResult && onResult(displayResult)}
        variant="outline"
        size="sm"
        disabled={isZeroOrInvalid}
        className={`w-full mt-3 ${
          isZeroOrInvalid
            ? "border-muted text-muted-foreground/40 opacity-50 cursor-not-allowed"
            : "border-emerald text-emerald hover:bg-emerald/10"
        }`}
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        Use This Answer
      </Button>
    </div>
  );
}
