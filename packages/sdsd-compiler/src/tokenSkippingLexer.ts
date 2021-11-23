import { Lexer, Token, LexerState } from "moo";

export class TokenSkippingLexer implements Lexer {
  constructor(private lexer: Lexer, private ignoreTypes: string[] = []) {}

  formatError(token: Token, message?: string | undefined): string {
    return this.lexer.formatError(token, message);
  }

  next(): Token | undefined {
    while (true) {
      const token = this.lexer.next();

      if (token && this.ignoreTypes.includes(token.type ?? "")) {
        continue;
      }

      return token;
    }
  }

  popState() {
    return this.lexer.popState();
  }

  pushState(state: string) {
    return this.lexer.pushState(state);
  }

  reset(chunk?: string | undefined, state?: LexerState | undefined): this {
    this.lexer.reset(chunk, state);
    return this;
  }

  save(): LexerState {
    return this.lexer.save();
  }

  setState(state: string) {
    return this.lexer.setState(state);
  }

  has(tokenType: string): boolean {
    if (this.ignoreTypes.includes(tokenType)) {
      return false;
    }

    return this.lexer.has(tokenType);
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        const token = this.next();

        return {
          value: token,
          done: true as const,
        };
      },
    };
  }
}
