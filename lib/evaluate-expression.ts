type Token = { type: "number"; value: number } | { type: "op"; value: string } | { type: "paren"; value: "(" | ")" };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (ch === " ") { i++; continue; }

    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch });
      i++;
      continue;
    }

    if (ch === "+" || ch === "−" || ch === "-" || ch === "×" || ch === "*" || ch === "÷" || ch === "/") {
      const normalized = ch === "×" ? "*" : ch === "÷" ? "/" : ch === "−" ? "-" : ch;

      // Unary minus: at start, after '(', or after an operator
      if (normalized === "-") {
        const prev = tokens[tokens.length - 1];
        if (!prev || (prev.type === "paren" && prev.value === "(") || prev.type === "op") {
          // Parse as negative number
          i++;
          let numStr = "-";
          while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
            numStr += expr[i];
            i++;
          }
          if (numStr === "-") return null; // lone minus with nothing after
          const val = parseFloat(numStr);
          if (isNaN(val)) return null;
          tokens.push({ type: "number", value: val });
          continue;
        }
      }

      tokens.push({ type: "op", value: normalized });
      i++;
      continue;
    }

    if (/\d/.test(ch) || ch === ".") {
      let numStr = "";
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
        numStr += expr[i];
        i++;
      }
      const val = parseFloat(numStr);
      if (isNaN(val)) return null;
      tokens.push({ type: "number", value: val });
      continue;
    }

    // Unknown character
    return null;
  }

  return tokens.length > 0 ? tokens : null;
}

// Recursive descent parser: expression → term → factor
function parse(tokens: Token[]): number | null {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function factor(): number | null {
    const tok = peek();
    if (!tok) return null;

    if (tok.type === "number") {
      consume();
      return tok.value;
    }

    if (tok.type === "paren" && tok.value === "(") {
      consume(); // '('
      const val = expression();
      if (val === null) return null;
      const closing = peek();
      if (closing && closing.type === "paren" && closing.value === ")") {
        consume(); // ')'
      }
      // If no closing paren, still return the value (auto-close)
      return val;
    }

    return null;
  }

  function term(): number | null {
    let left = factor();
    if (left === null) return null;

    while (peek()?.type === "op" && (peek()!.value === "*" || peek()!.value === "/")) {
      const op = consume().value;
      const right = factor();
      if (right === null) return null;
      left = op === "*" ? left * right : left / right;
    }

    return left;
  }

  function expression(): number | null {
    let left = term();
    if (left === null) return null;

    while (peek()?.type === "op" && (peek()!.value === "+" || peek()!.value === "-")) {
      const op = consume().value;
      const right = term();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }

    return left;
  }

  const result = expression();
  // All tokens should be consumed
  if (pos !== tokens.length) return null;
  return result;
}

/**
 * Evaluate a math expression string. Returns null on invalid/empty input.
 * Supports +, -, ×, ÷, parentheses, decimals, and unary negative.
 */
export function evaluateExpression(expr: string): number | null {
  if (!expr || !expr.trim()) return null;
  const tokens = tokenize(expr);
  if (!tokens) return null;
  const result = parse(tokens);
  if (result === null || !isFinite(result)) return result;
  // Round to avoid floating point artifacts
  return Math.round(result * 1e10) / 1e10;
}

/**
 * Auto-close unmatched opening parentheses by appending ')'.
 */
export function autoCloseParens(expr: string): string {
  let open = 0;
  for (const ch of expr) {
    if (ch === "(") open++;
    else if (ch === ")") open--;
  }
  return expr + ")".repeat(Math.max(0, open));
}
