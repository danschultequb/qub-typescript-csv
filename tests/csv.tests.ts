import * as assert from "assert";
import * as qub from "qub";

import * as csv from "../sources/csv";

function parseQubLexes(text: string, startIndex: number = 0): qub.Iterable<qub.Lex> {
    return new qub.Lexer(text, startIndex).toArrayList();
}

suite("csv", () => {
});