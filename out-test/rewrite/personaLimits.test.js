"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const personaLimits_js_1 = require("./personaLimits.js");
(0, node_test_1.describe)('truncateToWordBoundary', () => {
    (0, node_test_1.it)('returns text unchanged when under the limit', () => {
        strict_1.default.equal((0, personaLimits_js_1.truncateToWordBoundary)('short commit', 72), 'short commit');
    });
    (0, node_test_1.it)('truncates on a word boundary', () => {
        const result = (0, personaLimits_js_1.truncateToWordBoundary)('🐄 fix: convince validation some manners please', 40);
        strict_1.default.ok(result.length <= 40);
        strict_1.default.ok(!result.endsWith(' '));
        strict_1.default.match(result, /convince validation some/);
    });
});
(0, node_test_1.describe)('getPersonaMaxLength', () => {
    (0, node_test_1.it)('uses persona max_length when present', () => {
        const metadata = {
            raw: { max_length: 60 },
        };
        strict_1.default.equal((0, personaLimits_js_1.getPersonaMaxLength)(metadata), 60);
    });
    (0, node_test_1.it)('defaults to 72', () => {
        strict_1.default.equal((0, personaLimits_js_1.getPersonaMaxLength)(undefined), 72);
    });
});
//# sourceMappingURL=personaLimits.test.js.map