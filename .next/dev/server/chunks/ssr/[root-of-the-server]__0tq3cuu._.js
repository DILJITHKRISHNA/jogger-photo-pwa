module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/app/(exec)/stock/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StockPage,
    "dynamic",
    ()=>dynamic,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package-check.mjs [app-rsc] (ecmascript) <export default as PackageCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$app$2d$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/executive/app-header.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2f$executive$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth/executive.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$repository$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/repository.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
const metadata = {
    title: "Today's Stock"
};
const dynamic = "force-dynamic";
function formatUpdated(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}
async function StockPage() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2f$executive$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireExecutiveSession"])();
    const [categories, { stockDate }, counts] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$repository$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["listCategories"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$repository$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStockGallery"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$repository$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStockCategoryCounts"])()
    ]);
    const updated = formatUpdated(stockDate);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$app$2d$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AppHeader"], {
                title: "Today's Stock",
                backHref: "/",
                session: session
            }, void 0, false, {
                fileName: "[project]/app/(exec)/stock/page.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            updated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "border-b border-border bg-muted/50 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground",
                children: [
                    "Stock list updated ",
                    updated
                ]
            }, void 0, true, {
                fileName: "[project]/app/(exec)/stock/page.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-3 text-xs text-muted-foreground",
                        children: "Pick a category to view and share today's stock photos in it."
                    }, void 0, false, {
                        fileName: "[project]/app/(exec)/stock/page.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    categories.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
                        children: "No categories yet."
                    }, void 0, false, {
                        fileName: "[project]/app/(exec)/stock/page.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-3",
                        children: categories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `/stock/${category.slug}`,
                                className: "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.97]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__["PackageCheck"], {
                                            className: "size-5"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(exec)/stock/page.tsx",
                                            lineNumber: 56,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(exec)/stock/page.tsx",
                                        lineNumber: 55,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[15px] font-bold leading-tight",
                                                children: category.name
                                            }, void 0, false, {
                                                fileName: "[project]/app/(exec)/stock/page.tsx",
                                                lineNumber: 59,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-0.5 text-xs text-muted-foreground",
                                                children: [
                                                    counts.get(category.slug) ?? 0,
                                                    " article",
                                                    (counts.get(category.slug) ?? 0) === 1 ? "" : "s"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(exec)/stock/page.tsx",
                                                lineNumber: 60,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(exec)/stock/page.tsx",
                                        lineNumber: 58,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, category.id, true, {
                                fileName: "[project]/app/(exec)/stock/page.tsx",
                                lineNumber: 50,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(exec)/stock/page.tsx",
                        lineNumber: 48,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(exec)/stock/page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(exec)/stock/page.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/(exec)/stock/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(exec)/stock/page.tsx [app-rsc] (ecmascript)"));
}),
"[project]/components/brand-mark.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BrandMark",
    ()=>BrandMark
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-rsc] (ecmascript)");
;
;
function BrandMark({ className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
        src: "/icons/icon.svg",
        alt: "Jogger",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("shrink-0 rounded-2xl object-contain", className)
    }, void 0, false, {
        fileName: "[project]/components/brand-mark.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/executive/app-header.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-rsc] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$brand$2d$mark$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/brand-mark.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$executive$2d$menu$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/executive/executive-menu.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
function AppHeader({ title, backHref, session }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto flex h-14 max-w-lg items-center gap-2 px-3",
            children: [
                backHref ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                    href: backHref,
                    className: "-ml-1 flex size-9 items-center justify-center rounded-full text-foreground/80 hover:bg-muted",
                    "aria-label": "Back",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                        className: "size-5"
                    }, void 0, false, {
                        fileName: "[project]/components/executive/app-header.tsx",
                        lineNumber: 26,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/executive/app-header.tsx",
                    lineNumber: 21,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$brand$2d$mark$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BrandMark"], {
                    className: "size-9 rounded-xl"
                }, void 0, false, {
                    fileName: "[project]/components/executive/app-header.tsx",
                    lineNumber: 29,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/components/executive/app-header.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$executive$2d$menu$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ExecutiveMenu"], {
                    name: session.name,
                    employeeId: session.employeeId
                }, void 0, false, {
                    fileName: "[project]/components/executive/app-header.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/executive/app-header.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/executive/app-header.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/executive/executive-menu.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExecutiveMenu",
    ()=>ExecutiveMenu
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ExecutiveMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ExecutiveMenu() from the server but ExecutiveMenu is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/executive/executive-menu.tsx", "ExecutiveMenu");
}),
"[project]/components/executive/executive-menu.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExecutiveMenu",
    ()=>ExecutiveMenu
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ExecutiveMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ExecutiveMenu() from the server but ExecutiveMenu is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/executive/executive-menu.tsx <module evaluation>", "ExecutiveMenu");
}),
"[project]/components/executive/executive-menu.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$executive$2d$menu$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/components/executive/executive-menu.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$executive$2d$menu$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/components/executive/executive-menu.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$executive$2f$executive$2d$menu$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/lib/db/repository.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addImportRecord",
    ()=>addImportRecord,
    "checkProductStatus",
    ()=>checkProductStatus,
    "createCategory",
    ()=>createCategory,
    "deleteCategory",
    ()=>deleteCategory,
    "deleteProduct",
    ()=>deleteProduct,
    "getCategoryGallery",
    ()=>getCategoryGallery,
    "getDashboardStats",
    ()=>getDashboardStats,
    "getImportById",
    ()=>getImportById,
    "getNewModelGallery",
    ()=>getNewModelGallery,
    "getProductByKey",
    ()=>getProductByKey,
    "getSchemeGallery",
    ()=>getSchemeGallery,
    "getStockCategoryCounts",
    ()=>getStockCategoryCounts,
    "getStockGallery",
    ()=>getStockGallery,
    "listCategories",
    ()=>listCategories,
    "listImports",
    ()=>listImports,
    "listNewModel",
    ()=>listNewModel,
    "listProducts",
    ()=>listProducts,
    "listScheme",
    ()=>listScheme,
    "listStock",
    ()=>listStock,
    "replaceStock",
    ()=>replaceStock,
    "searchByArticle",
    ()=>searchByArticle,
    "updateCategory",
    ()=>updateCategory,
    "upsertNewModelEntries",
    ()=>upsertNewModelEntries,
    "upsertProduct",
    ()=>upsertProduct,
    "upsertSchemeEntries",
    ()=>upsertSchemeEntries
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/seed.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/product-key.ts [app-rsc] (ecmascript)");
;
;
;
;
async function listCategories(opts = {}) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const categories = [
        ...db.categories
    ].sort((a, b)=>a.sortOrder - b.sortOrder);
    return opts.includeHidden ? categories : categories.filter((c)=>!c.hidden);
}
async function createCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name is required");
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["slugify"])(trimmed);
        if (db.categories.some((c)=>c.slug === slug)) {
            throw new Error(`Category "${trimmed}" already exists`);
        }
        const now = new Date().toISOString();
        const category = {
            id: `cat_${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])()}`,
            name: trimmed,
            slug,
            hidden: false,
            sortOrder: db.categories.length,
            createdAt: now,
            updatedAt: now
        };
        db.categories.push(category);
        return category;
    });
}
async function updateCategory(id, patch) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const category = db.categories.find((c)=>c.id === id);
        if (!category) return null;
        if (patch.name !== undefined) {
            const trimmed = patch.name.trim();
            if (trimmed) {
                category.name = trimmed;
                category.slug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["slugify"])(trimmed);
            }
        }
        if (patch.hidden !== undefined) {
            category.hidden = patch.hidden;
        }
        category.updatedAt = new Date().toISOString();
        return category;
    });
}
async function deleteCategory(id) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const before = db.categories.length;
        db.categories = db.categories.filter((c)=>c.id !== id);
        db.products.forEach((p)=>{
            if (p.categoryId === id) p.categoryId = null;
        });
        return db.categories.length < before;
    });
}
async function listProducts(filter) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    let products = [
        ...db.products
    ];
    if (filter?.categoryId) {
        products = products.filter((p)=>p.categoryId === filter.categoryId);
    }
    if (filter?.activeOnly) {
        products = products.filter((p)=>p.active);
    }
    return products.sort((a, b)=>a.article.localeCompare(b.article));
}
async function getProductByKey(article, colour) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(article, colour);
    return db.products.find((p)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour) === key) ?? null;
}
async function upsertProduct(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const article = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(input.article);
        const colour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeColour"])(input.colour);
        const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(article, colour);
        const now = new Date().toISOString();
        const existing = db.products.find((p)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour) === key);
        if (existing) {
            existing.categoryId = input.categoryId ?? existing.categoryId;
            existing.photoUrl = input.photoUrl;
            existing.photoFilename = input.photoFilename;
            existing.active = true;
            existing.updatedAt = now;
            return existing;
        }
        const product = {
            id: `prod_${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])()}`,
            article,
            colour,
            categoryId: input.categoryId,
            photoUrl: input.photoUrl,
            photoFilename: input.photoFilename,
            active: true,
            createdAt: now,
            updatedAt: now
        };
        db.products.push(product);
        return product;
    });
}
async function deleteProduct(id) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const before = db.products.length;
        db.products = db.products.filter((p)=>p.id !== id);
        return db.products.length < before;
    });
}
async function replaceStock(entries) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const stockDate = new Date().toISOString();
        db.stock = entries.map((e)=>({
                article: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(e.article),
                colour: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeColour"])(e.colour),
                category: e.category,
                stockDate
            }));
        return {
            stockDate,
            count: db.stock.length
        };
    });
}
async function listStock() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    return db.stock;
}
async function upsertSchemeEntries(entries) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const now = new Date().toISOString();
        const byKey = new Map(db.scheme.map((e)=>[
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour),
                e
            ]));
        for (const e of entries){
            const article = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(e.article);
            const colour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeColour"])(e.colour);
            const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(article, colour);
            const existing = byKey.get(key);
            if (existing) {
                existing.article = article;
                existing.colour = colour;
            } else {
                const entry = {
                    article,
                    colour,
                    addedAt: now
                };
                byKey.set(key, entry);
            }
        }
        db.scheme = Array.from(byKey.values());
        return {
            count: db.scheme.length
        };
    });
}
async function listScheme() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    return db.scheme;
}
async function upsertNewModelEntries(entries) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const now = new Date().toISOString();
        const byKey = new Map(db.newModels.map((e)=>[
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour),
                e
            ]));
        for (const e of entries){
            const article = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(e.article);
            const colour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeColour"])(e.colour);
            const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(article, colour);
            const existing = byKey.get(key);
            if (existing) {
                existing.article = article;
                existing.colour = colour;
            } else {
                const entry = {
                    article,
                    colour,
                    addedAt: now
                };
                byKey.set(key, entry);
            }
        }
        db.newModels = Array.from(byKey.values());
        return {
            count: db.newModels.length
        };
    });
}
async function listNewModel() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    return db.newModels;
}
async function addImportRecord(record) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mutateDb"])((db)=>{
        const full = {
            ...record,
            id: `imp_${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])()}`,
            uploadedAt: new Date().toISOString()
        };
        db.imports.unshift(full);
        db.imports = db.imports.slice(0, 200);
        return full;
    });
}
async function listImports(type) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const all = [
        ...db.imports
    ].sort((a, b)=>b.uploadedAt.localeCompare(a.uploadedAt));
    return type ? all.filter((i)=>i.type === type) : all;
}
async function getImportById(id) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    return db.imports.find((i)=>i.id === id) ?? null;
}
/* ------------------------------------------------------------------ */ /* Read-side views for the executive frontend                          */ /* ------------------------------------------------------------------ */ function toView(product, categories) {
    const category = categories.find((c)=>c.id === product.categoryId) ?? null;
    return {
        id: product.id,
        article: product.article,
        colour: product.colour,
        category: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        photoUrl: product.photoUrl
    };
}
async function searchByArticle(article) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const needle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(article);
    if (!needle) return [];
    return db.products.filter((p)=>p.active && p.article.includes(needle)).sort((a, b)=>a.colour.localeCompare(b.colour)).map((p)=>toView(p, db.categories));
}
async function getCategoryGallery(categorySlug) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const category = db.categories.find((c)=>c.slug === categorySlug);
    if (!category) return [];
    return db.products.filter((p)=>p.active && p.categoryId === category.id).sort((a, b)=>a.article.localeCompare(b.article)).map((p)=>toView(p, db.categories));
}
async function getStockGallery(categorySlug) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    if (db.stock.length === 0) return {
        items: [],
        stockDate: null
    };
    const category = categorySlug ? db.categories.find((c)=>c.slug === categorySlug) : undefined;
    if (categorySlug && !category) return {
        items: [],
        stockDate: null
    };
    const byKey = new Map(db.products.filter((p)=>p.active && (!category || p.categoryId === category.id)).map((p)=>[
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour),
            p
        ]));
    const items = [];
    for (const entry of db.stock){
        const product = byKey.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(entry.article, entry.colour));
        if (product) items.push(toView(product, db.categories));
    }
    return {
        items: items.sort((a, b)=>a.article.localeCompare(b.article)),
        stockDate: db.stock[0]?.stockDate ?? null
    };
}
async function getStockCategoryCounts() {
    const { items } = await getStockGallery();
    const counts = new Map();
    for (const item of items){
        if (!item.categorySlug) continue;
        counts.set(item.categorySlug, (counts.get(item.categorySlug) ?? 0) + 1);
    }
    return counts;
}
async function getSchemeGallery() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const byKey = new Map(db.products.filter((p)=>p.active).map((p)=>[
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour),
            p
        ]));
    const items = [];
    for (const entry of db.scheme){
        const product = byKey.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(entry.article, entry.colour));
        if (product) items.push(toView(product, db.categories));
    }
    return items.sort((a, b)=>a.article.localeCompare(b.article));
}
async function getNewModelGallery() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const byKey = new Map(db.products.filter((p)=>p.active).map((p)=>[
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour),
            p
        ]));
    const items = [];
    for (const entry of db.newModels){
        const product = byKey.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(entry.article, entry.colour));
        if (product) items.push(toView(product, db.categories));
    }
    return items.sort((a, b)=>a.article.localeCompare(b.article));
}
async function checkProductStatus(article, colour) {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(article, colour);
    const product = db.products.find((p)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour) === key) ?? null;
    const category = product ? db.categories.find((c)=>c.id === product.categoryId) ?? null : null;
    return {
        article: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeArticle"])(article),
        colour: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeColour"])(colour),
        hasPhoto: Boolean(product),
        photoUrl: product?.photoUrl ?? null,
        category: category?.name ?? null,
        inStock: db.stock.some((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour) === key),
        inScheme: db.scheme.some((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour) === key),
        isNewModel: db.newModels.some((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour) === key)
    };
}
async function getDashboardStats() {
    const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDb"])();
    const byKey = new Map(db.products.filter((p)=>p.active).map((p)=>[
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(p.article, p.colour),
            p
        ]));
    const missingStockPhotoCount = db.stock.filter((e)=>!byKey.has((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$product$2d$key$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["productKey"])(e.article, e.colour))).length;
    const lastOf = (type)=>db.imports.filter((i)=>i.type === type).sort((a, b)=>b.uploadedAt.localeCompare(a.uploadedAt))[0]?.uploadedAt ?? null;
    const lastPhotoUpdate = db.products.length > 0 ? db.products.map((p)=>p.updatedAt).sort().reverse()[0] : null;
    const recentImportErrorCount = db.imports.slice(0, 10).reduce((sum, i)=>sum + i.errorCount, 0);
    return {
        photosCount: db.products.filter((p)=>p.active).length,
        activeArticleCount: new Set(db.products.filter((p)=>p.active).map((p)=>p.article)).size,
        categoriesCount: db.categories.filter((c)=>!c.hidden).length,
        stockArticleCount: db.stock.length,
        schemeCount: db.scheme.length,
        newModelCount: db.newModels.length,
        missingStockPhotoCount,
        lastPhotoUpdate,
        lastStockUpload: lastOf("stock"),
        lastSchemeUpload: lastOf("scheme"),
        lastNewModelUpload: lastOf("new-model"),
        recentImportErrorCount
    };
}
}),
"[project]/lib/db/seed.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "emptyDatabase",
    ()=>emptyDatabase,
    "slugify",
    ()=>slugify
]);
const DEFAULT_CATEGORY_NAMES = [
    "PU Gents",
    "PU Ladies",
    "EVA",
    "Supersoft",
    "Casual",
    "Sports",
    "Kids"
];
function slugify(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function emptyDatabase() {
    const now = new Date().toISOString();
    return {
        categories: DEFAULT_CATEGORY_NAMES.map((name, index)=>({
                id: `cat_${slugify(name)}`,
                name,
                slug: slugify(name),
                hidden: false,
                sortOrder: index,
                createdAt: now,
                updatedAt: now
            })),
        products: [],
        stock: [],
        scheme: [],
        newModels: [],
        imports: []
    };
}
}),
"[project]/lib/db/store.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mutateDb",
    ()=>mutateDb,
    "readDb",
    ()=>readDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$data$2d$path$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/server-data-path.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/seed.ts [app-rsc] (ecmascript)");
;
;
;
const DB_FILENAME = "db.json";
let memoryDatabase = null;
/** Serializes reads/writes so concurrent admin requests never corrupt the JSON file. */ let writeQueue = Promise.resolve();
function withLock(task) {
    const next = writeQueue.then(task, task);
    writeQueue = next.catch(()=>undefined);
    return next;
}
function parseDatabase(raw) {
    try {
        const parsed = JSON.parse(raw);
        const fallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["emptyDatabase"])();
        return {
            categories: Array.isArray(parsed.categories) ? parsed.categories : fallback.categories,
            products: Array.isArray(parsed.products) ? parsed.products : [],
            stock: Array.isArray(parsed.stock) ? parsed.stock : [],
            scheme: Array.isArray(parsed.scheme) ? parsed.scheme : [],
            newModels: Array.isArray(parsed.newModels) ? parsed.newModels : [],
            imports: Array.isArray(parsed.imports) ? parsed.imports : []
        };
    } catch  {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["emptyDatabase"])();
    }
}
async function loadFromDisk() {
    const filePath = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$data$2d$path$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWritableDataFilePath"])(DB_FILENAME);
    if (!filePath) {
        return memoryDatabase ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["emptyDatabase"])();
    }
    try {
        const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(filePath, "utf8");
        const parsed = parseDatabase(raw);
        memoryDatabase = parsed;
        return parsed;
    } catch  {
        const seeded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$seed$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["emptyDatabase"])();
        memoryDatabase = seeded;
        return seeded;
    }
}
async function persistToDisk(db) {
    memoryDatabase = db;
    const filePath = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$data$2d$path$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWritableDataFilePath"])(DB_FILENAME);
    if (!filePath) return;
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
    } catch (error) {
        console.error("Failed to persist database to disk:", error);
        throw error;
    }
}
async function readDb() {
    if (memoryDatabase) return memoryDatabase;
    return loadFromDisk();
}
async function mutateDb(mutator) {
    return withLock(async ()=>{
        const current = memoryDatabase ?? await loadFromDisk();
        const draft = structuredClone(current);
        const result = await mutator(draft);
        await persistToDisk(draft);
        return result;
    });
}
}),
"[project]/lib/product-key.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Article + Colour = the unique product key throughout the system. */ __turbopack_context__.s([
    "labelFor",
    ()=>labelFor,
    "normalizeArticle",
    ()=>normalizeArticle,
    "normalizeColour",
    ()=>normalizeColour,
    "productKey",
    ()=>productKey
]);
function normalizeArticle(value) {
    return value.trim().toUpperCase().replace(/\s+/g, " ");
}
function normalizeColour(value) {
    return value.trim().toUpperCase().replace(/\s+/g, " ");
}
function productKey(article, colour) {
    return `${normalizeArticle(article)}::${normalizeColour(colour)}`;
}
function labelFor(article, colour) {
    return `${article} ${colour}`;
}
}),
"[project]/lib/server-data-path.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getWritableDataDirectory",
    ()=>getWritableDataDirectory,
    "getWritableDataFilePath",
    ()=>getWritableDataFilePath,
    "getWritableUploadsDirectory",
    ()=>getWritableUploadsDirectory
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:os [external] (node:os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
;
let cachedDataDirectory = null;
let writableDirectoryChecked = false;
async function getWritableDataDirectory() {
    if (writableDirectoryChecked) {
        return cachedDataDirectory;
    }
    writableDirectoryChecked = true;
    const candidates = [
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "data"),
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["default"].tmpdir(), "jogger-photo-pwa-data")
    ];
    for (const directory of candidates){
        try {
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].mkdir(directory, {
                recursive: true
            });
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(directory, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["constants"].W_OK);
            const testFile = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(directory, ".write-test");
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(testFile, "ok", "utf8");
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].unlink(testFile);
            cachedDataDirectory = directory;
            return directory;
        } catch  {
            continue;
        }
    }
    cachedDataDirectory = null;
    return null;
}
async function getWritableDataFilePath(filename) {
    const directory = await getWritableDataDirectory();
    if (!directory) return null;
    // The directory is resolved at runtime (dev dir or OS tmp dir), so tell
    // Turbopack not to trace the whole project through this dynamic join.
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(/* turbopackIgnore: true */ directory, filename);
}
async function getWritableUploadsDirectory() {
    const directory = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", "products");
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].mkdir(directory, {
            recursive: true
        });
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(directory, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["constants"].W_OK);
        return directory;
    } catch  {
        return null;
    }
}
}),
"[project]/lib/utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-rsc] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0tq3cuu._.js.map