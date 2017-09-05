import * as assert from "assert";
import * as qub from "qub";

import * as csv from "../sources/csv";

suite("csv", () => {
    function buildDocumentText(rows: number, columns: number): string {
        let text: string = "";
        for (let row = 0; row < rows; ++row) {
            for (let column = 0; column < columns; ++column) {
                if (column > 0) {
                    text += ",";
                }
                text += "hello";
            }

            if (row < columns - 1) {
                text += "\n";
            }
        }
        return text;
    }

    suite("Document", () => {
        suite("getPosition()", () => {
            function getPositionTest(text: string, characterIndex: number, expectedPosition: csv.Position, expectedIssues: qub.Issue[] = []) {
                test(`with ${qub.escapeAndQuote(text)} text and ${characterIndex} characterIndex`, () => {
                    const document: csv.Document = csv.parse(text);
                    assert.deepStrictEqual(document.getPosition(characterIndex), expectedPosition);
                });
            }

            getPositionTest(undefined, undefined, undefined);
            getPositionTest(undefined, null, undefined);
            getPositionTest(undefined, -1, undefined);
            getPositionTest(undefined, 0, undefined);
            getPositionTest(undefined, 1, undefined);

            getPositionTest(null, undefined, undefined);
            getPositionTest(null, null, undefined);
            getPositionTest(null, -1, undefined);
            getPositionTest(null, 0, undefined);
            getPositionTest(null, 1, undefined);

            getPositionTest("", undefined, undefined);
            getPositionTest("", null, undefined);
            getPositionTest("", -1, undefined);
            getPositionTest("", 0, new csv.Position(0, 0));
            getPositionTest("", 1, new csv.Position(0, 0));

            getPositionTest("hello", undefined, undefined);
            getPositionTest("hello", null, undefined);
            getPositionTest("hello", -1, undefined);
            getPositionTest("hello", 0, new csv.Position(0, 0));
            getPositionTest("hello", 1, new csv.Position(0, 0));

            getPositionTest(",", undefined, undefined);
            getPositionTest(",", null, undefined);
            getPositionTest(",", -1, undefined);
            getPositionTest(",", 0, new csv.Position(0, 0));
            getPositionTest(",", 1, new csv.Position(0, 1));

            getPositionTest("\n", undefined, undefined);
            getPositionTest("\n", null, undefined);
            getPositionTest("\n", -1, undefined);
            getPositionTest("\n", 0, new csv.Position(0, 0));
            getPositionTest("\n", 1, new csv.Position(1, 0));

            getPositionTest("\n\n\n", 0, new csv.Position(0, 0));
            getPositionTest("\n\n\n", 1, new csv.Position(1, 0));
            getPositionTest("\n\n\n", 2, new csv.Position(2, 0));
            getPositionTest("\n\n\n", 3, new csv.Position(3, 0));
            getPositionTest("\n\n\n", 4, new csv.Position(3, 0));
            getPositionTest("\n\n\n", 5, new csv.Position(3, 0));

            getPositionTest(`""\n""\n""\n`, 0, new csv.Position(0, 0));
            getPositionTest(`""\n""\n""\n`, 1, new csv.Position(0, 0));
            getPositionTest(`""\n""\n""\n`, 2, new csv.Position(0, 0));
            getPositionTest(`""\n""\n""\n`, 3, new csv.Position(1, 0));
            getPositionTest(`""\n""\n""\n`, 4, new csv.Position(1, 0));
            getPositionTest(`""\n""\n""\n`, 5, new csv.Position(1, 0));
            getPositionTest(`""\n""\n""\n`, 6, new csv.Position(2, 0));
            getPositionTest(`""\n""\n""\n`, 7, new csv.Position(2, 0));
            getPositionTest(`""\n""\n""\n`, 8, new csv.Position(2, 0));
            getPositionTest(`""\n""\n""\n`, 9, new csv.Position(3, 0));
            getPositionTest(`""\n""\n""\n`, 10, new csv.Position(3, 0));
            getPositionTest(`""\n""\n""\n`, 11, new csv.Position(3, 0));
            getPositionTest(`""\n""\n""\n`, 12, new csv.Position(3, 0));

            suite("stress test", () => {
                function getPositionStressTest(rows: number, columns: number, characterIndex: number, expectedPosition: csv.Position) {
                    const text: string = buildDocumentText(rows, columns);
                    test(`with ${rows}x${columns} cell document at ${characterIndex} characterIndex`, () => {
                        const document: csv.Document = csv.parse(text);
                        assert.deepStrictEqual(document.getPosition(characterIndex), expectedPosition);
                    });
                }
    
                getPositionStressTest(1, 1, 0, new csv.Position(0, 0));
                getPositionStressTest(1, 1, 1, new csv.Position(0, 0));
                getPositionStressTest(1, 1, 10, new csv.Position(0, 0));
                getPositionStressTest(10, 10, 0, new csv.Position(0, 0));
                getPositionStressTest(10, 10, 1000, new csv.Position(9, 9));
                getPositionStressTest(10, 100, 0, new csv.Position(0, 0));
                getPositionStressTest(10, 1000, 1000, new csv.Position(0, 166));
                getPositionStressTest(10, 1000, 10000, new csv.Position(1, 666));
                getPositionStressTest(100, 1, 0, new csv.Position(0, 0));
                getPositionStressTest(100, 10, 0, new csv.Position(0, 0));
                getPositionStressTest(100, 100, 0, new csv.Position(0, 0));
                getPositionStressTest(100, 1000, 0, new csv.Position(0, 0));
                getPositionStressTest(1000, 1, 0, new csv.Position(0, 0));
                getPositionStressTest(1000, 10, 123456, new csv.Position(9, 8919));
                getPositionStressTest(1000, 100, 0, new csv.Position(0, 0));
                getPositionStressTest(1000, 1000, 0, new csv.Position(0, 0));
                getPositionStressTest(1000, 1000, 9999999, new csv.Position(999, 999));
                getPositionStressTest(10000, 10, 1234567, new csv.Position(9, 89919));
            });
        });
    });

    suite("parse()", () => {
        function parseTest(text: string, expectedIssues: qub.Issue[] = []): void {
            test(`with ${qub.escapeAndQuote(text)} with no issues list`, () => {
                const document: csv.Document = csv.parse(text);
                assert.deepStrictEqual(document.toString(), text);
            });

            test(`with ${qub.escapeAndQuote(text)} with issues list`, () => {
                const issues = new qub.ArrayList<qub.Issue>();
                const document: csv.Document = csv.parse(text, issues);
                assert.deepStrictEqual(document.toString(), text);
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parseTest("");
        parseTest("   ");
        parseTest("A,B,C,D\n1,2,3,4\n,,,")
        parseTest(`"abc`, [
            csv.Issues.missingClosingQuote(new qub.Span(0, 4))
        ]);
        parseTest(`"Then he said, ""Hi there!"""`)

        suite("stress test", () => {
            function parseStressTest(rows: number, columns: number, expectedIssues: qub.Issue[] = []): void {
                const text: string = buildDocumentText(rows, columns);
                test(`with ${rows}x${columns} cell document with no issues`, () => {
                    const document: csv.Document = csv.parse(text);
                    assert.deepStrictEqual(document.toString(), text);
                });

                test(`with ${rows}x${columns} cell document with issues`, () => {
                    const issues = new qub.ArrayList<qub.Issue>();
                    const document: csv.Document = csv.parse(text, issues);
                    assert.deepStrictEqual(document.toString(), text);
                    assert.deepStrictEqual(issues.toArray(), expectedIssues);
                });
            }

            parseStressTest(1, 1);
            parseStressTest(10, 10);
            parseStressTest(10, 100);
            parseStressTest(10, 1000);
            parseStressTest(100, 1);
            parseStressTest(100, 10);
            parseStressTest(100, 100);
            parseStressTest(100, 1000);
            parseStressTest(1000, 1);
            parseStressTest(1000, 10);
            parseStressTest(1000, 100);
            parseStressTest(1000, 1000);
        });
    });
});