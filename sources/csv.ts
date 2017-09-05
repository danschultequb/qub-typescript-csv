import * as qub from "qub";

/**
 * Add the provided issue to the provided issue List. If the Issue list is null or undefined, then
 * nothing will happen.
 * @param issues The issues list to add the issue to. This can be null or undefined.
 * @param toAdd The issue to add.
 */
function addIssue(issues: qub.List<qub.Issue>, toAdd: qub.Issue): void {
    issues.add(toAdd);
}

/**
 * The issues that can appear when parsing a CSV document.
 */
export class Issues {
    /**
     * A quoted string is missing its closing quote.
     * @param span The span over which this issue occurs.
     */
    public static missingClosingQuote(span: qub.Span): qub.Issue {
        return qub.Error(`Missing closing quote (").`, span);
    }
}

/**
 * A row and column position within a CSV document.
 */
export class Position {
    /**
     * Create a new Position from the provided rowIndex and columnIndex.
     * @param _rowIndex The rowIndex of the Position.
     * @param _columnIndex The columnIndex of the Position.
     */
    constructor(private _rowIndex: number, private _columnIndex: number) {
    }
}

/**
 * A parsed CSV document.
 */
export class Document {
    /**
     * Create a new Document from the provided document text.
     * @param _text The text of this CSV document.
     */
    constructor(private _text: string) {
    }

    /**
     * Get the row and column cell Position that contains the provided character index.
     * @param characterIndex The character index in the document.
     */
    public getPosition(characterIndex: number): Position {
        let result: Position;

        if (qub.isDefined(this._text) && qub.isDefined(characterIndex) && 0 <= characterIndex) {
            const lexer = new qub.Lexer(this._text);
            let rowIndex: number = 0;
            let columnIndex: number = 0;

            while (lexer.next()) {
                const currentLex: qub.Lex = lexer.getCurrent();
                if (characterIndex <= currentLex.startIndex) {
                    break;
                }
                else if (currentLex.getType() === qub.LexType.Comma) {
                    ++columnIndex;
                }
                else if (currentLex.isNewLine()) {
                    ++rowIndex;
                    columnIndex = 0;
                }
            }

            result = new Position(rowIndex, columnIndex);
        }

        return result;
    }

    /**
     * Get the text of this Document.
     */
    public toString(): string {
        return this._text;
    }
}

/**
 * Parse a CSV document from the provided documentText.
 * @param documentText The document text to parse.
 */
export function parse(documentText: string, issues?: qub.List<qub.Issue>): Document {
    if (documentText && issues) {
        const lexer = new qub.Lexer(documentText);
        lexer.next();

        while (lexer.hasCurrent()) {

            let tokenFinished: boolean = false;
            let isCell: boolean = false;
            let isSeparator: boolean = false;
            while (lexer.hasCurrent() && !tokenFinished) {

                const currentLex: qub.Lex = lexer.getCurrent();
                switch (currentLex.getType()) {
                    case qub.LexType.Comma:
                        if (!isCell) {
                            lexer.next();
                            isSeparator = true;
                        }
                        tokenFinished = true;
                        break;

                    case qub.LexType.NewLine:
                    case qub.LexType.CarriageReturnNewLine:
                        lexer.next();
                        tokenFinished = true;
                        break;

                    case qub.LexType.DoubleQuote:
                        isCell = true;
                        const startQuote: qub.Lex = currentLex;
                        lexer.next();

                        let quoteFinished: boolean = false;
                        let lastLex: qub.Lex = startQuote;
                        while (lexer.hasCurrent() && !quoteFinished) {
                            switch (lexer.getCurrent().getType()) {
                                case qub.LexType.DoubleQuote:
                                    lastLex = lexer.takeCurrent();
                                    let oddQuoteCount: boolean = true;
                                    while (lexer.hasCurrent() && lexer.getCurrent().getType() === qub.LexType.DoubleQuote) {
                                        lastLex = lexer.takeCurrent();
                                        oddQuoteCount = !oddQuoteCount;
                                    }

                                    if (oddQuoteCount) {
                                        quoteFinished = true;
                                    }
                                    break;

                                default:
                                    lastLex = lexer.takeCurrent();
                                    break;
                            }
                        }

                        if (!quoteFinished) {
                            addIssue(issues, Issues.missingClosingQuote(new qub.Span(startQuote.startIndex, lastLex.afterEndIndex - startQuote.startIndex)));
                        }
                        break;

                    default:
                        isCell = true;
                        lexer.next();
                        break;
                }
            }
        }
    }

    return new Document(documentText);
}