import * as qub from "qub";

function addIssue(issues: qub.List<qub.Issue>, toAdd: qub.Issue): void {
    if (issues) {
        issues.add(toAdd);
    }
}

export class Issues {
    public static missingClosingQuote(span: qub.Span): qub.Issue {
        return qub.Error(`Missing closing quote (").`, span);
    }
}

/**
 * An individual token of a row. This can be either a cell, a comma, or a new line.
 */
export class Token {
    constructor(private _lexes: qub.Iterable<qub.Lex>, private _isSeparator: boolean) {
    }

    public getStartIndex(): number {
        const firstLex: qub.Lex = this._lexes ? this._lexes.first() : undefined;
        return firstLex ? firstLex.startIndex : undefined;
    }

    public getAfterEndIndex(): number {
        const lastLex: qub.Lex = this._lexes ? this._lexes.last() : undefined;
        return lastLex ? lastLex.afterEndIndex : undefined;
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
 * A row of tokens within a CSV Document.
 */
export class Row {
    private _cells: qub.Indexable<Token>;

    constructor(private _tokens: qub.Indexable<Token>) {
    }

    public endsWithNewLine(): boolean {
        let result: boolean = false;
        if (this._tokens) {
            const lastToken: Token = this._tokens.last();
            if (lastToken) {
                result = lastToken.isNewLine();
            }
        }
        return result;
    }

    public getStartIndex(): number {
        const firstToken: Token = this._tokens ? this._tokens.first() : undefined;
        return firstToken ? firstToken.getStartIndex() : undefined;
    }

    public getAfterEndIndex(): number {
        const lastToken: Token = this._tokens ? this._tokens.last() : undefined;
        return lastToken ? lastToken.getAfterEndIndex() : undefined;
    }

    public getColumnIndex(characterIndex: number): number {
        let result: number;

        if (qub.isDefined(characterIndex)) {
            const rowStartIndex: number = this.getStartIndex();
            if (!qub.isDefined(rowStartIndex)) {
                if (characterIndex === 0) {
                    result = 0;
                }
            }
            else if (rowStartIndex <= characterIndex && characterIndex <= this.getAfterEndIndex()) {
                let columnIndex: number = 0;
                for (const token of this._tokens) {
                    if (!token.isSeparator()) {
                        if (!token.isNewLine() && characterIndex <= token.getAfterEndIndex()) {
                            result = columnIndex;
                            break;
                        }
                    }
                    else if (characterIndex <= token.getStartIndex()) {
                        result = columnIndex;
                        break;
                    }
                    else {
                        ++columnIndex;
                        if (characterIndex === token.getAfterEndIndex()) {
                            result = columnIndex;
                            break;
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     * Get the data cells that make up this row. If there are two separators next to each other in
     * this row, then an empty Token cell will be returned between the separators.
     */
    public getCells(): qub.Indexable<Token> {
        if (!this._cells) {
            const cells = new qub.ArrayList<Token>();

            if (this._tokens) {
                let previousTokenWasCell: boolean = false;
                let previousTokenWasSeparator: boolean = false;
                for (const token of this._tokens) {
                    if (token.isSeparator()) {
                        if (!previousTokenWasCell) {
                            cells.add(new Token(new qub.ArrayList<qub.Lex>(), false));
                        }
                        previousTokenWasCell = false;
                        previousTokenWasSeparator = true;
                    }
                    else if (token.isNewLine()) {
                        previousTokenWasCell = false;
                        previousTokenWasSeparator = false;
                    }
                    else {
                        cells.add(token);
                        previousTokenWasCell = true;
                        previousTokenWasSeparator = false;
                    }
                }

                if (previousTokenWasSeparator) {
                    cells.add(new Token(new qub.ArrayList<qub.Lex>(), false));
                }
            }

            this._cells = cells;
        }

        return this._cells;
    }

    /**
     * Get the cell in the provided columnIndex. If no cell exists in the provided columnIndex, such
     * as if the columnIndex is negative or greater than or equal to the column count, then
     * undefined will be returned.
     * @param columnIndex The column index of the cell to return.
     */
    public getCell(columnIndex: number): Token {
        return this.getCells().get(columnIndex);
    }

    /**
     * Get the number of cells that are in this Row.
     */
    public getCellCount(): number {
        return this.getCells().getCount();
    }

    /**
     * Get the string representation of this Row.
     */
    public toString(): string {
        return qub.getCombinedText(this._tokens);
    }
}

/**
 * A column of Tokens within a CSV document.
 */
export class Column {
    private _cells: qub.Indexable<Token>;

    constructor(private _document: Document, private _columnIndex: number) {
    }

    /**
     * Get the data cells that make up this column. If a row doesn't have a cell for this column,
     * then undefined will appear for that row's cell.
     */
    public getCells(): qub.Indexable<Token> {
        if (!this._cells) {
            const cells = new qub.ArrayList<Token>();

            if (this._document && qub.isDefined(this._columnIndex) && 0 <= this._columnIndex && this._columnIndex < this._document.getColumnCount()) {
                for (const row of this._document.getRows()) {
                    cells.add(row.getCell(this._columnIndex));
                }
            }

            this._cells = cells;
        }
        return this._cells;
    }

    /**
     * Get the cell in the provided rowIndex. If no cell exists in the provided rowIndex, such as if
     * the rowIndex is negative or greater than or equal to the row count, then undefined will be
     * returned.
     * @param rowIndex The row index of the cell to return.
     */
    public getCell(rowIndex: number): Token {
        return this.getCells().get(rowIndex);
    }

    /**
     * Get the number of cells that are in this Column.
     */
    public getCellCount(): number {
        return this.getCells().getCount();
    }

    /**
     * Get the string representation of this column.
     */
    public toString(): string {
        let result: string = "";
        for (const cell of this.getCells()) {
            if (result) {
                result += ",";
            }
            result += cell.toString();
        }
        return result;
    }
}

/**
 * A parsed CSV document.
 */
export class Document {
    private _columns: qub.Indexable<Column>;

    constructor(private _rows: qub.Indexable<Row>) {
        if (!_rows) {
            this._rows = new qub.ArrayList<Row>();
        }
    }

    /**
     * Get the rows that make up this Document.
     */
    public getRows(): qub.Indexable<Row> {
        return this._rows;
    }

    /**
     * Get the row at the provided rowIndex. If the rowIndex doesn't exist in this Document, then
     * undefined will be returned.
     * @param rowIndex The index of the row
     */
    public getRow(rowIndex: number): Row {
        return this._rows.get(rowIndex);
    }

    /**
     * Get the number of rows in this Document.
     */
    public getRowCount(): number {
        return this._rows.getCount();
    }

    /**
     * Get the columns that make up this Document.
     */
    public getColumns(): qub.Indexable<Column> {
        if (!this._columns) {
            const columns = new qub.ArrayList<Column>();

            const columnCount: number = this._rows.map((row: Row) => row.getCellCount()).maximum();
            for (let i = 0; i < columnCount; ++i) {
                columns.add(new Column(this, i));
            }

            this._columns = columns;
        }
        return this._columns;
    }

    /**
     * Get the column at the provided columnIndex. If the columnIndex doesn't exist in this
     * Document, then undefined will be returned.
     * @param columnIndex The index of the column.
     */
    public getColumn(columnIndex: number): Column {
        return this.getColumns().get(columnIndex);
    }

    /**
     * Get the number of columns in this Document. If the rows in the document don't have the same
     * number of columns, then the maximum column count of the rows in the document will be
     * returned.
     */
    public getColumnCount(): number {
        return this.getColumns().getCount();
    }

    /**
     * Get the index of the row that contains the characterIndex, or undefined if no row contains
     * the provided characterIndex.
     * @param characterIndex The character index within a document.
     */
    public getRowIndex(characterIndex: number): number {
        let result: number;

        if (qub.isDefined(characterIndex) && 0 <= characterIndex) {
            if (characterIndex === 0) {
                result = 0;
            }
            else {
                let rowIndex: number = 0;
                for (const row of this.getRows()) {
                    const rowEndsWithNewLine: boolean = row.endsWithNewLine();
                    const rowAfterEndIndex: number = row.getAfterEndIndex();

                    if (rowEndsWithNewLine) {
                        if (characterIndex < rowAfterEndIndex) {
                            result = rowIndex;
                            break;
                        }
                        else {
                            ++rowIndex;
                            if (characterIndex === rowAfterEndIndex) {
                                result = rowIndex;
                                break;
                            }
                        }
                    }
                    else if (characterIndex <= rowAfterEndIndex) {
                        result = rowIndex;
                        break;
                    }
                    else {
                        ++rowIndex;
                    }
                }
            }
        }

        return result;
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
export function parseToken(lexes: qub.Iterator<qub.Lex>, issues: qub.List<qub.Issue>): Token {
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

            case qub.LexType.DoubleQuote:
                isCell = true;
                const startQuote: qub.Lex = currentLex;
                tokenLexes.add(startQuote);
                lexes.next();
                let quoteFinished: boolean = false;
                while (lexes.hasCurrent() && !quoteFinished) {
                    switch (lexes.getCurrent().getType()) {
                        case qub.LexType.DoubleQuote:
                            tokenLexes.add(lexes.takeCurrent());
                            let oddQuoteCount: boolean = true;
                            while (lexes.hasCurrent() && lexes.getCurrent().getType() === qub.LexType.DoubleQuote) {
                                tokenLexes.add(lexes.takeCurrent());
                                oddQuoteCount = !oddQuoteCount;
                            }

                            if (oddQuoteCount) {
                                quoteFinished = true;
                            }
                            break;

                        default:
                            tokenLexes.add(lexes.takeCurrent());
                            break;
                    }
                }

                if (!quoteFinished) {
                    addIssue(issues, Issues.missingClosingQuote(new qub.Span(startQuote.startIndex, tokenLexes.last().afterEndIndex - startQuote.startIndex)));
                }
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

export function parseRow(lexes: qub.Iterator<qub.Lex>, issues: qub.List<qub.Issue>): Row {
    if (!lexes.hasStarted()) {
        lexes.next();
    }

    const rowTokens = new qub.ArrayList<Token>();
    let rowFinished: boolean = false;
    while (lexes.hasCurrent() && !rowFinished) {

        const token: Token = parseToken(lexes, issues);
        if (token.isNewLine()) {
            rowFinished = true;
        }

        rowTokens.add(token);
    }

    return new Row(rowTokens);
}

/**
 * Parse a CSV document from the provided documentText.
 * @param documentText The document text to parse.
 */
export function parse(documentText: string, issues?: qub.List<qub.Issue>): Document {
    const lexer = new qub.Lexer(documentText, 0);

    const rows = new qub.ArrayList<Row>();
    do {
        rows.add(parseRow(lexer, issues));
    }
    while (lexer.hasCurrent());

    return new Document(rows);
}