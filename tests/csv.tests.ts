import * as assert from "assert";
import * as qub from "qub";

import * as csv from "../sources/csv";

function parseQubLexes(text: string, startIndex: number = 0): qub.Iterable<qub.Lex> {
    return new qub.Lexer(text, startIndex).toArrayList();
}

suite("csv", () => {
    suite("Token", () => {
        test("with undefined lexes", () => {
            const token = new csv.Token(undefined);
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "");
        });

        test("with empty lexes", () => {
            const token = new csv.Token(parseQubLexes(""));
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "");
        });

        test("with comma lex", () => {
            const token = new csv.Token(parseQubLexes(","));
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), ",");
        });

        test("with newline lex", () => {
            const token = new csv.Token(parseQubLexes("\n"));
            assert.deepStrictEqual(token.isNewLine(), true);
            assert.deepStrictEqual(token.toString(), "\n");
        });

        test("with carriage return and newline lex", () => {
            const token = new csv.Token(parseQubLexes("\r\n"));
            assert.deepStrictEqual(token.isNewLine(), true);
            assert.deepStrictEqual(token.toString(), "\r\n");
        });

        test("with cell data lexes", () => {
            const token = new csv.Token(parseQubLexes("a1b2"));
            assert.deepStrictEqual(token.isNewLine(), false);
            assert.deepStrictEqual(token.toString(), "a1b2");
        });
    });

    suite("Row", () => {
        function parseToken(text: string, startIndex: number = 0): csv.Token {
            return csv.parseToken(parseQubLexes(text, startIndex).iterate());
        }

        test("with undefined tokens", () => {
            const row = new csv.Row(undefined);
            assert.deepStrictEqual(row.toString(), "");
        });

        test("with empty tokens", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>());
            assert.deepStrictEqual(row.toString(), "");
        });

        test("with one cell token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("a")]));
            assert.deepStrictEqual(row.toString(), "a");
        });

        test("with one comma token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken(",")]));
            assert.deepStrictEqual(row.toString(), ",");
        });

        test("with one newline token", () => {
            const row = new csv.Row(new qub.ArrayList<csv.Token>([parseToken("\n")]));
            assert.deepStrictEqual(row.toString(), "\n");
        });
    });

    suite("Table", () => {
        function parseRow(text: string, startIndex: number = 0): csv.Row {
            return csv.parseRow(parseQubLexes(text, startIndex).iterate());
        }

        test("with undefined rows", () => {
            const table = new csv.Table(undefined);
            assert.deepStrictEqual(table.toString(), "");
        });

        test("with empty rows", () => {
            const table = new csv.Table(new qub.ArrayList<csv.Row>());
            assert.deepStrictEqual(table.toString(), "");
        });

        function tableTest(tableText: string): void {
            test(`with ${qub.escapeAndQuote(tableText)}`, () => {
                const rowTexts: string[] = tableText.split("\n");
                const rows = new qub.ArrayList<csv.Row>();
                let rowStart: number = 0;
                for (let rowEnd: number = 0; rowEnd < tableText.length; ++rowEnd) {
                    if (tableText[rowEnd] === "\n") {
                        const rowText: string = tableText.substring(rowStart, rowEnd + 1);
                        rows.add(parseRow(rowText, rowStart));
                        rowStart = rowEnd + 1;
                    }
                }
                rows.add(parseRow(tableText.substring(rowStart, tableText.length)));

                const table = new csv.Table(rows);
                assert.deepStrictEqual(table.toString(), tableText);
            });
        }

        tableTest("")
        tableTest("  ");
        tableTest("abc");
        tableTest("1234");
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
                const table: csv.Table = csv.parse(text);
                assert.deepStrictEqual(table.toString(), text);
            });
        }

        parseTest("");
        parseTest("   ");
        parseTest("A,B,C,D\n1,2,3,4\n,,,")
    });
});