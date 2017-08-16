import * as assert from "assert";
import * as qub from "qub";

import * as csv from "../sources/csv";

function parseQubLexes(text: string, startIndex: number = 0): qub.Iterable<qub.Lex> {
    return new qub.Lexer(text, startIndex).toArrayList();
}

function toString(value: { toString(): string }): string {
    return value ? value.toString() : undefined;
}

suite("csv", () => {
    suite("Token", () => {
        test("with undefined lexes", () => {
            const token = new csv.Token(undefined, false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "");
            assert.deepStrictEqual(token.getStartIndex(), undefined);
            assert.deepStrictEqual(token.getAfterEndIndex(), undefined);
        });

        test("with empty lexes", () => {
            const token = new csv.Token(parseQubLexes(""), false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "");
            assert.deepStrictEqual(token.getStartIndex(), undefined);
            assert.deepStrictEqual(token.getAfterEndIndex(), undefined);
        });

        test("with comma lex", () => {
            const token = new csv.Token(parseQubLexes(","), true);
            assert.deepStrictEqual(token.isSeparator(), true);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), ",");
            assert.deepStrictEqual(token.getStartIndex(), 0);
            assert.deepStrictEqual(token.getAfterEndIndex(), 1);
        });

        test("with comma lex but not a separator", () => {
            const token = new csv.Token(parseQubLexes(","), false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), ",");
            assert.deepStrictEqual(token.getStartIndex(), 0);
            assert.deepStrictEqual(token.getAfterEndIndex(), 1);
        });

        test("with newline lex", () => {
            const token = new csv.Token(parseQubLexes("\n"), false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), true);
            assert.deepStrictEqual(token.toString(), "\n");
            assert.deepStrictEqual(token.getStartIndex(), 0);
            assert.deepStrictEqual(token.getAfterEndIndex(), 1);
        });

        test("with carriage return and newline lex", () => {
            const token = new csv.Token(parseQubLexes("\r\n"), false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), true);
            assert.deepStrictEqual(token.toString(), "\r\n");
            assert.deepStrictEqual(token.getStartIndex(), 0);
            assert.deepStrictEqual(token.getAfterEndIndex(), 2);
        });

        test("with cell data lexes", () => {
            const token = new csv.Token(parseQubLexes("a1b2"), false);
            assert.deepStrictEqual(token.isSeparator(), false);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "a1b2");
            assert.deepStrictEqual(token.getStartIndex(), 0);
            assert.deepStrictEqual(token.getAfterEndIndex(), 4);
        });
    });

    suite("Row", () => {
        function parseToken(text: string, startIndex: number = 0): csv.Token {
            return csv.parseToken(parseQubLexes(text, startIndex).iterate());
        }

        function getRowCellsAsStrings(row: csv.Row): string[] {
            return row.getCells().map(toString).toArray();
        }

        test("with undefined tokens", () => {
            const row = new csv.Row(undefined);
            assert.deepStrictEqual(getRowCellsAsStrings(row), []);
            assert.deepStrictEqual(row.toString(), "");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0), undefined);
            assert.deepStrictEqual(row.getCell(1), undefined);
            assert.deepStrictEqual(row.getCellCount(), 0);
            assert.deepStrictEqual(row.getStartIndex(), undefined);
            assert.deepStrictEqual(row.getAfterEndIndex(), undefined);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number = i === 0 ? 0 : undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with empty tokens", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>());
            assert.deepStrictEqual(getRowCellsAsStrings(row), []);
            assert.deepStrictEqual(row.toString(), "");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0), undefined);
            assert.deepStrictEqual(row.getCell(1), undefined);
            assert.deepStrictEqual(row.getCellCount(), 0);
            assert.deepStrictEqual(row.getStartIndex(), undefined);
            assert.deepStrictEqual(row.getAfterEndIndex(), undefined);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number = i === 0 ? 0 : undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with one cell token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("a")]));
            assert.deepStrictEqual(getRowCellsAsStrings(row), ["a"]);
            assert.deepStrictEqual(row.toString(), "a");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0).toString(), "a");
            assert.deepStrictEqual(row.getCell(1), undefined);
            assert.deepStrictEqual(row.getCellCount(), 1);
            assert.deepStrictEqual(row.getStartIndex(), 0);
            assert.deepStrictEqual(row.getAfterEndIndex(), 1);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number =
                    0 <= i && i <= 1 ? 0 :
                        undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with one comma token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken(",")]));
            assert.deepStrictEqual(getRowCellsAsStrings(row), ["", ""]);
            assert.deepStrictEqual(row.toString(), ",");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0).toString(), "");
            assert.deepStrictEqual(row.getCell(1).toString(), "");
            assert.deepStrictEqual(row.getCell(2), undefined);
            assert.deepStrictEqual(row.getCellCount(), 2);
            assert.deepStrictEqual(row.getStartIndex(), 0);
            assert.deepStrictEqual(row.getAfterEndIndex(), 1);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number =
                    i === 0 ? 0 :
                        i === 1 ? 1 :
                            undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with one newline token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("\n")]));
            assert.deepStrictEqual(getRowCellsAsStrings(row), []);
            assert.deepStrictEqual(row.toString(), "\n");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0), undefined);
            assert.deepStrictEqual(row.getCell(1), undefined);
            assert.deepStrictEqual(row.getCellCount(), 0);
            assert.deepStrictEqual(row.getStartIndex(), 0);
            assert.deepStrictEqual(row.getAfterEndIndex(), 1);
            assert.deepStrictEqual(row.endsWithNewLine(), true);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number = undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with a cell token and a comma token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("abc"), parseToken(",", 3)]));
            assert.deepStrictEqual(getRowCellsAsStrings(row), ["abc", ""]);
            assert.deepStrictEqual(row.toString(), "abc,");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0).toString(), "abc");
            assert.deepStrictEqual(row.getCell(1).toString(), "");
            assert.deepStrictEqual(row.getCell(2), undefined);
            assert.deepStrictEqual(row.getCellCount(), 2);
            assert.deepStrictEqual(row.getStartIndex(), 0);
            assert.deepStrictEqual(row.getAfterEndIndex(), 4);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number =
                    0 <= i && i <= 3 ? 0 :
                        i === 4 ? 1 :
                            undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });

        test("with a multiple cells and commas", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("abc"), parseToken(",", 3), parseToken(",", 4), parseToken("123", 5), parseToken(",", 8), parseToken("   ", 9)]));
            assert.deepStrictEqual(getRowCellsAsStrings(row), ["abc", "", "123", "   "]);
            assert.deepStrictEqual(row.toString(), "abc,,123,   ");
            assert.deepStrictEqual(row.getCell(-1), undefined);
            assert.deepStrictEqual(row.getCell(0).toString(), "abc");
            assert.deepStrictEqual(row.getCell(1).toString(), "");
            assert.deepStrictEqual(row.getCell(2).toString(), "123");
            assert.deepStrictEqual(row.getCell(3).toString(), "   ");
            assert.deepStrictEqual(row.getCell(4), undefined);
            assert.deepStrictEqual(row.getCellCount(), 4);
            assert.deepStrictEqual(row.getStartIndex(), 0);
            assert.deepStrictEqual(row.getAfterEndIndex(), 12);
            assert.deepStrictEqual(row.endsWithNewLine(), false);
            assert.deepStrictEqual(row.getColumnIndex(undefined), undefined);
            assert.deepStrictEqual(row.getColumnIndex(null), undefined);
            for (let i = -1; i <= row.toString().length + 1; ++i) {
                const actualColumnIndex: number = row.getColumnIndex(i);
                const expectedColumnIndex: number =
                    0 <= i && i <= 3 ? 0 :
                        i === 4 ? 1 :
                            5 <= i && i <= 8 ? 2 :
                                9 <= i && i <= 12 ? 3 :
                                    undefined;
                assert.deepStrictEqual(actualColumnIndex, expectedColumnIndex, `For characterIndex ${i}, the expected columnIndex is ${expectedColumnIndex}, not ${actualColumnIndex}.`);
            }
        });
    });

    suite("Column", () => {
        function getColumnCellsAsStrings(column: csv.Column): string[] {
            return column.getCells().map(toString).toArray();
        }

        test("with undefined document", () => {
            const document: csv.Document = csv.parse("");
            const column = new csv.Column(undefined, 2);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0), undefined);
            assert.deepStrictEqual(column.getCell(1), undefined);
            assert.deepStrictEqual(column.getCellCount(), 0);
            assert.deepStrictEqual(column.toString(), "");
        });

        test("with undefined columnIndex", () => {
            const document: csv.Document = csv.parse("");
            const column = new csv.Column(document, undefined);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), []);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0), undefined);
            assert.deepStrictEqual(column.getCell(1), undefined);
            assert.deepStrictEqual(column.getCellCount(), 0);
            assert.deepStrictEqual(column.toString(), "");
        });

        test("with -1 columnIndex", () => {
            const document: csv.Document = csv.parse("");
            const column = new csv.Column(document, -1);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), []);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0), undefined);
            assert.deepStrictEqual(column.getCell(1), undefined);
            assert.deepStrictEqual(column.getCellCount(), 0);
            assert.deepStrictEqual(column.toString(), "");
        });

        test("with 0 columnIndex and empty document", () => {
            const document: csv.Document = csv.parse("");
            const column = new csv.Column(document, 0);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), []);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0), undefined);
            assert.deepStrictEqual(column.getCell(1), undefined);
            assert.deepStrictEqual(column.getCellCount(), 0);
            assert.deepStrictEqual(column.toString(), "");
        });

        test("with 0 columnIndex and non-empty document", () => {
            const document: csv.Document = csv.parse("a,b,c\n1,2,3\n ,\t,  ");
            const column = new csv.Column(document, 0);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), ["a", "1", " "]);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0).toString(), "a");
            assert.deepStrictEqual(column.getCell(1).toString(), "1");
            assert.deepStrictEqual(column.getCell(2).toString(), " ");
            assert.deepStrictEqual(column.getCell(3), undefined);
            assert.deepStrictEqual(column.getCellCount(), 3);
            assert.deepStrictEqual(column.toString(), "a,1, ");
        });

        test("with 1 columnIndex and non-empty document", () => {
            const document: csv.Document = csv.parse("a,b,c\n1,2,3\n ,\t,  ");
            const column = new csv.Column(document, 1);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), ["b", "2", "\t"]);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0).toString(), "b");
            assert.deepStrictEqual(column.getCell(1).toString(), "2");
            assert.deepStrictEqual(column.getCell(2).toString(), "\t");
            assert.deepStrictEqual(column.getCell(3), undefined);
            assert.deepStrictEqual(column.getCellCount(), 3);
            assert.deepStrictEqual(column.toString(), "b,2,\t");
        });

        test("with 2 columnIndex and non-empty document", () => {
            const document: csv.Document = csv.parse("a,b,c\n1,2,3\n ,\t,  ");
            const column = new csv.Column(document, 2);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), ["c", "3", "  "]);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0).toString(), "c");
            assert.deepStrictEqual(column.getCell(1).toString(), "3");
            assert.deepStrictEqual(column.getCell(2).toString(), "  ");
            assert.deepStrictEqual(column.getCell(3), undefined);
            assert.deepStrictEqual(column.getCellCount(), 3);
            assert.deepStrictEqual(column.toString(), "c,3,  ");
        });

        test("with 3 columnIndex and non-empty document", () => {
            const document: csv.Document = csv.parse("a,b,c\n1,2,3\n ,\t,  ");
            const column = new csv.Column(document, 3);
            assert.deepStrictEqual(getColumnCellsAsStrings(column), []);
            assert.deepStrictEqual(column.getCell(-1), undefined);
            assert.deepStrictEqual(column.getCell(0), undefined);
            assert.deepStrictEqual(column.getCell(1), undefined);
            assert.deepStrictEqual(column.getCellCount(), 0);
            assert.deepStrictEqual(column.toString(), "");
        });
    });

    suite("Document", () => {
        function parseRow(text: string, startIndex: number = 0): csv.Row {
            return csv.parseRow(parseQubLexes(text, startIndex).iterate());
        }

        function getRowsAsStrings(document: csv.Document): string[] {
            return document.getRows().map(toString).toArray();
        }

        function getColumnsAsStrings(document: csv.Document): string[] {
            return document.getColumns().map(toString).toArray();
        }

        test("with undefined rows", () => {
            const document = new csv.Document(undefined);
            assert.deepStrictEqual(document.toString(), "");
            assert.deepStrictEqual(getRowsAsStrings(document), []);
            assert.deepStrictEqual(getColumnsAsStrings(document), []);
            assert.deepStrictEqual(getColumnsAsStrings(document), []);
            for (let i = -1; i <= document.toString().length + 1; ++i) {
                const actualRowIndex: number = document.getRowIndex(i);
                const expectedRowIndex: number =
                    i === 0 ? 0 : undefined;
                assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
            }
        });

        test("with empty rows", () => {
            const document = new csv.Document(new qub.ArrayList<csv.Row>());
            assert.deepStrictEqual(document.toString(), "");
            assert.deepStrictEqual(getRowsAsStrings(document), []);
            assert.deepStrictEqual(getColumnsAsStrings(document), []);
            assert.deepStrictEqual(getColumnsAsStrings(document), []);
            for (let i = -1; i <= document.toString().length + 1; ++i) {
                const actualRowIndex: number = document.getRowIndex(i);
                const expectedRowIndex: number =
                    i === 0 ? 0 : undefined;
                assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
            }
        });

        function documentTest(documentText: string): void {
            test(`with ${qub.escapeAndQuote(documentText)}`, () => {
                const rowTexts: string[] = documentText.split("\n");
                const rows = new qub.ArrayList<csv.Row>();
                let rowStart: number = 0;
                for (let rowEnd: number = 0; rowEnd < documentText.length; ++rowEnd) {
                    if (documentText[rowEnd] === "\n") {
                        const rowText: string = documentText.substring(rowStart, rowEnd + 1);
                        rows.add(parseRow(rowText, rowStart));
                        rowStart = rowEnd + 1;
                    }
                }
                rows.add(parseRow(documentText.substring(rowStart, documentText.length)));

                const document = new csv.Document(rows);
                assert.deepStrictEqual(document.toString(), documentText);
                assert.deepStrictEqual(getRowsAsStrings(document), rows.map(toString).toArray());
                assert.deepStrictEqual(document.getRowCount(), rows.getCount());

                for (let i = -1; i <= document.getRowCount(); ++i) {
                    const row: csv.Row = document.getRow(i);

                    if (0 <= i && i < document.getRowCount()) {
                        const expectedRow: csv.Row = rows.get(i);
                        assert.deepStrictEqual(row.toString(), expectedRow.toString());
                    }
                    else {
                        assert.deepStrictEqual(row, undefined);
                    }
                }

                for (let i = -1; i <= document.getColumnCount(); ++i) {
                    const column: csv.Column = document.getColumn(i);

                    if (0 <= i && i < document.getColumnCount()) {
                        const expectedColumn = new csv.Column(document, i);
                        assert.deepStrictEqual(column.toString(), expectedColumn.toString());
                    }
                    else {
                        assert.deepStrictEqual(column, undefined);
                    }
                }
            });
        }

        documentTest("")
        documentTest("  ");
        documentTest("abc");
        documentTest("1234");

        suite(`getRowIndex()`, () => {
            test(`with ""`, () => {
                const document: csv.Document = csv.parse("");
                assert.deepStrictEqual(document.getRowIndex(undefined), undefined);
                assert.deepStrictEqual(document.getRowIndex(null), undefined);
                for (let i = -1; i <= document.toString().length + 1; ++i) {
                    const actualRowIndex: number = document.getRowIndex(i);
                    const expectedRowIndex: number = i === 0 ? 0 : undefined;
                    assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
                }
            });

            test(`with "abc"`, () => {
                const document: csv.Document = csv.parse("abc");
                assert.deepStrictEqual(document.getRowIndex(undefined), undefined);
                assert.deepStrictEqual(document.getRowIndex(null), undefined);
                for (let i = -1; i <= document.toString().length + 1; ++i) {
                    const actualRowIndex: number = document.getRowIndex(i);
                    const expectedRowIndex: number =
                        0 <= i && i <= 3 ? 0 :
                            undefined;
                    assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
                }
            });

            test(`with ${qub.escapeAndQuote("abc\n")}`, () => {
                const document: csv.Document = csv.parse("abc\n");
                assert.deepStrictEqual(document.getRowIndex(undefined), undefined);
                assert.deepStrictEqual(document.getRowIndex(null), undefined);
                for (let i = -1; i <= document.toString().length + 1; ++i) {
                    const actualRowIndex: number = document.getRowIndex(i);
                    const expectedRowIndex: number =
                        0 <= i && i <= 3 ? 0 :
                            i === 4 ? 1 :
                                undefined;
                    assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
                }
            });

            test(`with ${qub.escapeAndQuote("abc\nd")}`, () => {
                const document: csv.Document = csv.parse("abc\nd");
                assert.deepStrictEqual(document.getRowIndex(undefined), undefined);
                assert.deepStrictEqual(document.getRowIndex(null), undefined);
                for (let i = -1; i <= document.toString().length + 1; ++i) {
                    const actualRowIndex: number = document.getRowIndex(i);
                    const expectedRowIndex: number =
                        0 <= i && i <= 3 ? 0 :
                            4 <= i && i <= 5 ? 1 :
                                undefined;
                    assert.deepStrictEqual(actualRowIndex, expectedRowIndex, `For characterIndex ${i}, the expected row index is ${expectedRowIndex}, not ${actualRowIndex}.`);
                }
            });
        });

        suite(`format()`, () => {
            function formatTest(text: string, expectedFormattedText: string = text): void {
                test(`with ${qub.escapeAndQuote(text)}`, () => {
                    const document: csv.Document = csv.parse(text);
                    assert.deepStrictEqual(document.format(), expectedFormattedText);
                });
            }

            formatTest(undefined, "");
            formatTest(null, "");
            formatTest("");
            formatTest(",");
            formatTest("hello");
            formatTest("a, b , c,d");
            formatTest("a,b,c,d\n e ,f  , g,h  ", "a  ,b  ,c ,d  \n e ,f  , g,h  ");
        });
    });

    suite("parseToken()", () => {
        function parseTokenTest(text: string, expectedTokenText: string = text, expectedLex?: qub.Lex): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const lexes = new qub.Lexer(text);

                const token: csv.Token = csv.parseToken(lexes);
                assert.deepStrictEqual(token.toString(), expectedTokenText);

                assert.deepStrictEqual(lexes.getCurrent(), expectedLex);
            });
        }

        parseTokenTest("");
        parseTokenTest("hello");
        parseTokenTest("123");
        parseTokenTest("hello,there", "hello", qub.Comma(5));
        parseTokenTest("hello\nthere", "hello", qub.NewLine(5));
        parseTokenTest("hello\r\nthere", "hello", qub.CarriageReturnNewLine(5));
        parseTokenTest(",");
        parseTokenTest(",  oops", ",", qub.Space(1));
        parseTokenTest("\n");
        parseTokenTest("\n500", "\n", qub.Digits("500", 1));
        parseTokenTest("\r\n");
        parseTokenTest("\r\n ", "\r\n", qub.Space(2));
    });

    suite("parseRow()", () => {
        function parseRowTest(text: string, expectedRowText: string = text, expectedLex?: qub.Lex): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const lexes = new qub.Lexer(text);

                const row: csv.Row = csv.parseRow(lexes);
                assert.deepStrictEqual(row.toString(), expectedRowText);

                assert.deepStrictEqual(lexes.getCurrent(), expectedLex);
            });

            test(`with ${qub.escapeAndQuote(text)} with started Lex iterator`, () => {
                const lexes = new qub.Lexer(text);
                lexes.next();

                const row: csv.Row = csv.parseRow(lexes);
                assert.deepStrictEqual(row.toString(), expectedRowText);

                assert.deepStrictEqual(lexes.getCurrent(), expectedLex);
            });
        }

        parseRowTest("");
        parseRowTest("hello");
        parseRowTest("123");
        parseRowTest("hello,there", "hello,there");
        parseRowTest("hello\nthere", "hello\n", qub.Letters("there", 6));
        parseRowTest("hello\r\nthere", "hello\r\n", qub.Letters("there", 7));
        parseRowTest(",");
        parseRowTest(",  oops", ",  oops");
        parseRowTest("\n");
        parseRowTest("\n500", "\n", qub.Digits("500", 1));
        parseRowTest("\r\n");
        parseRowTest("\r\n ", "\r\n", qub.Space(2));
    });

    suite("parse()", () => {
        function parseTest(text: string): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const document: csv.Document = csv.parse(text);
                assert.deepStrictEqual(document.toString(), text);
            });
        }

        parseTest("");
        parseTest("   ");
        parseTest("A,B,C,D\n1,2,3,4\n,,,")
    });
});