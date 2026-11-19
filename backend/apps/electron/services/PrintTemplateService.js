// Web edition: templates are bundled at build time (scripts/prepare.mjs).
const bundledTemplates = require("../../../platform/templates.generated");

function _load(templateName) {
    const content = bundledTemplates[templateName];
    if (typeof content !== "string") {
        throw new Error(`Print template "${templateName}" not found`);
    }
    return content;
}

function _renderBlock(html, data) {
    html = html.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (_, arrayKey, block) => {
        const items = data[arrayKey];

        if (!Array.isArray(items) || items.length === 0) {
            return "";
        }

        return items.map((item) => {
            return block.replace(/{{\s*(\w+)\s*}}/g, (__, prop) => {
                return item[prop] !== undefined && item[prop] !== null ? String(item[prop]) : "";
            });
        }).join("");
    });

    html = html.replace(/{{(\^)\s*(\w+)\s*}}([\s\S]*?){{\/\1}}/g, (_, _caret, arrayKey, block) => {
        const items = data[arrayKey];

        if (Array.isArray(items) && items.length > 0) {
            return "";
        }

        return block;
    });

    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, key, block) => {
        const value = data[key];
        const isTruthy = value !== undefined && value !== null && value !== "" && value !== false && value !== 0;
        return isTruthy ? block : "";
    });

    return html;
}

function _renderValues(html, data) {
    return html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        const value = data[key];
        return value !== undefined && value !== null ? String(value) : "";
    });
}

function render(templateName, data) {
    let html = _load(templateName);
    html = _renderBlock(html, data);
    html = _renderValues(html, data);
    return html;
}

function _extractBody(html) {
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : html;
}

/**
 * Renders the same template once per data object and stitches the bodies into a
 * single document, separated by page breaks. Lets features emit one page per
 * entity (for example one warehouse issue note per storage location) without the
 * template engine needing nested each blocks.
 */
function renderMany(templateName, dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return render(templateName, {});
    }

    if (dataArray.length === 1) {
        return render(templateName, dataArray[0]);
    }

    const first = render(templateName, dataArray[0]);
    const bodyOpenTag = first.match(/<body[^>]*>/i)?.[0] ?? "<body>";
    const head = first.slice(0, first.search(/<body\b/i));

    const sections = dataArray
        .map((data, index) => {
            const body = _extractBody(render(templateName, data));
            const pageBreak = index > 0 ? ' style="page-break-before: always;"' : "";
            return `<div${pageBreak}>${body}</div>`;
        })
        .join("");

    return `${head}${bodyOpenTag}${sections}</body></html>`;
}

module.exports = { render, renderMany };
