import * as qub from "qub";

/**
 * An individual token of a row. This can be either a cell, a comma, or a new line.
 */
export class Token {
    constructor(private _lexes: qub.Iterable<qub.Lex>, private _isSeparator: boolean) {
    }

    /**
     * Is this token a separator within a row. Typically in a CSV this is a comma, but the parse can
     * be configured so that this can be a semi-colon (;), a tab (\t), or a vertical bar (|).
     */
    public isSeparator(): boolean {
        return this._isSeparator;
    }

    /**
     * Get whether or not this Token is a newline token.
     */
    public isNewLine(): boolean {
        let result: boolean = false;
        if (this._lexes && this._lexes.getCount() === 1) {
            const lex: qub.Lex = this._lexes.first();
            result = lex.isNewLine();
        }
        return result;
    }

    /**
     * Get the string representation of this Token.
     */
    public toString(): string {
        return qub.getCombinedText(this._lexes);
    }
}

/**
 * A row of tokens within a CSV table.
 */
export class Row {
    constructor(private _tokens: qub.Iterable<Token>) {
    }

    public getCells(): qub.Iterable<Token> {
        const cells = new qub.ArrayList<Token>();

        if (this._tokens) {
            let previousTokenWasCell: boolean = false;
            for (const token of this._tokens) {
                if (token.isSeparator()) {
                    if (!previousTokenWasCell) {
                        cells.add(undefined);
                    }
                    previousTokenWasCell = false;
                }
                else if (token.isNewLine()) {
                    previousTokenWasCell = false;
                }
                else {
                    cells.add(token);
                    previousTokenWasCell = true;
                }
            }
        }

        return cells;
    }

    /**
     * Get the string representation of this Row.
     */
    public toString(): string {
        return qub.getCombinedText(this._tokens);
    }
}

/**
 * A collection or rows that make up a CSV document.
 */
export class Table {
    constructor(private _rows: qub.Iterable<Row>) {
    }

    /**
     * Get the string representation of this Row.
     */
    public toString(): string {
        return qub.getCombinedText(this._rows);
    }
}

/**
 * Parse a Token from the provided stream of lexes.
 * @param lexes The stream of lexes that the Token will be parsed from.
 */
export function parseToken(lexes: qub.Iterator<qub.Lex>): Token {
    if (!lexes.hasStarted()) {
        lexes.next();
    }

    const tokenLexes = new qub.ArrayList<qub.Lex>();
    let tokenFinished: boolean = false;
    let isCell: boolean = false;
    let isSeparator: boolean = false;
    while (lexes.hasCurrent() && !tokenFinished) {

        const currentLex: qub.Lex = lexes.getCurrent();
        switch (currentLex.getType()) {
            case qub.LexType.Comma:
                if (!isCell) {
                    tokenLexes.add(currentLex);
                    lexes.next();
                    isSeparator = true;
                }
                tokenFinished = true;
                break;

            case qub.LexType.NewLine:
            case qub.LexType.CarriageReturnNewLine:
                if (!isCell) {
                    tokenLexes.add(currentLex);
                    lexes.next();
                }
                tokenFinished = true;
                break;

            default:
                isCell = true;
                tokenLexes.add(currentLex);
                lexes.next();
                break;
        }
    }

    return new Token(tokenLexes, isSeparator);
}

export function parseRow(lexes: qub.Iterator<qub.Lex>): Row {
    if (!lexes.hasStarted()) {
        lexes.next();
    }

    const rowTokens = new qub.ArrayList<Token>();
    let rowFinished: boolean = false;
    while (lexes.hasCurrent() && !rowFinished) {

        const token: Token = parseToken(lexes);
        if (token.isNewLine()) {
            rowFinished = true;
        }

        rowTokens.add(token);
    }

    return new Row(rowTokens);
}

export function parse(document: string): Table {
    const lexer = new qub.Lexer(document, 0);

    const rows = new qub.ArrayList<Row>();
    do {
        rows.add(parseRow(lexer));
    }
    while (lexer.hasCurrent());

    return new Table(rows);
}