type Node = { evaluate: (t: number) => number; tex: string };
const unary: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sec: (v) => 1 / Math.cos(v),
  csc: (v) => 1 / Math.sin(v),
  cot: (v) => 1 / Math.tan(v),
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sech: (v) => 1 / Math.cosh(v),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
};
/** Small, bounded arithmetic parser. Never executes JavaScript or accesses objects. */
export function parseExpression(source: string, variableTex = 't'): Node {
  if (!source.trim()) throw new Error('Enter an expression for both coordinates.');
  if (source.length > 200) throw new Error('Keep each expression under 200 characters.');
  const tokens =
    source.toLowerCase().match(/(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[a-z]+|\*\*|[+\-*/^()]|\S/g) ||
    [];
  let index = 0,
    depth = 0;
  function expression(min = 0): Node {
    if (++depth > 32) throw new Error('This expression is nested too deeply.');
    const token = tokens[index++];
    let left: Node;
    if (token === '+' || token === '-') {
      const child = expression(25);
      left = {
        evaluate: (t) => (token === '-' ? -child.evaluate(t) : child.evaluate(t)),
        tex: `${token}${child.tex}`,
      };
    } else if (token === '(') {
      left = expression();
      if (tokens[index++] !== ')') throw new Error('Close every opening parenthesis.');
      left = { ...left, tex: `\\left(${left.tex}\\right)` };
    } else if (token === 't' || token === 'x') {
      left = { evaluate: (t) => t, tex: variableTex };
    } else if (token === 'pi' || token === 'e') {
      const value = token === 'pi' ? Math.PI : Math.E;
      left = { evaluate: () => value, tex: token === 'pi' ? '\\pi' : 'e' };
    } else if (token && Object.hasOwn(unary, token)) {
      if (tokens[index++] !== '(') throw new Error(`Use parentheses: ${token}(t).`);
      const child = expression();
      if (tokens[index++] !== ')') throw new Error(`Close the parentheses after ${token}.`);
      left = {
        evaluate: (t) => unary[token](child.evaluate(t)),
        tex:
          token === 'sqrt'
            ? `\\sqrt{${child.tex}}`
            : token === 'abs'
              ? `\\left|${child.tex}\\right|`
              : `\\operatorname{${token}}\\left(${child.tex}\\right)`,
      };
    } else if (token && /^(?:\d|\.)/.test(token) && Number.isFinite(Number(token))) {
      const value = Number(token);
      left = { evaluate: () => value, tex: String(value) };
    } else
      throw new Error(
        token
          ? `Unknown symbol “${token}”. Use t, numbers, or supported functions.`
          : 'The expression is incomplete.',
      );
    while (index < tokens.length) {
      const next = tokens[index];
      const implicit = next === '(' || /^[a-z]/.test(next) || /^\d|^\./.test(next);
      const op = implicit ? '*' : next;
      const precedence =
        op === '+' || op === '-'
          ? 10
          : op === '*' || op === '/'
            ? 20
            : op === '^' || op === '**'
              ? 30
              : -1;
      if (precedence < min) break;
      if (!implicit) index++;
      const right = expression(precedence + (precedence === 30 ? 0 : 1));
      const a = left,
        b = right;
      left = {
        evaluate: (t) => {
          const x = a.evaluate(t),
            y = b.evaluate(t);
          switch (op) {
            case '+':
              return x + y;
            case '-':
              return x - y;
            case '*':
              return x * y;
            case '/':
              return x / y;
            default:
              return x ** y;
          }
        },
        tex:
          op === '/'
            ? `\\frac{${a.tex}}{${b.tex}}`
            : precedence === 30
              ? `{${a.tex}}^{${b.tex}}`
              : `${a.tex}${op === '*' ? '\\cdot ' : op}${b.tex}`,
      };
    }
    depth--;
    return left;
  }
  const result = expression();
  if (index !== tokens.length) throw new Error(`Unexpected “${tokens[index]}”.`);
  return result;
}
