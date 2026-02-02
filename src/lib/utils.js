window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    // ========= helpers existants =========
    ns.uid =
        ns.uid ||
        function uid() {
            return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 7);
        };

    ns.clampInt =
        ns.clampInt ||
        function clampInt(v, min) {
            const n = parseInt(v, 10);
            if (Number.isNaN(n)) return min;
            return Math.max(min, n);
        };

    ns.clampFloat =
        ns.clampFloat ||
        function clampFloat(v, min) {
            const n = parseFloat(v);
            if (Number.isNaN(n)) return min;
            return Math.max(min, n);
        };

    ns.normalizeUrl =
        ns.normalizeUrl ||
        function normalizeUrl(url) {
            if (!url) return "";
            const u = String(url).trim();
            if (!u) return "";
            if (/^https?:\/\//i.test(u)) return u;
            return "https://" + u;
        };

    // ✅ FIX: cette fonction est utilisée par LinkTag (Buttons.jsx)
    ns.siteLabel =
        ns.siteLabel ||
        function siteLabel(url) {
            try {
                const u = new URL(ns.normalizeUrl(url));
                const host = (u.hostname || "").replace(/^www\./, "");
                const base = host.split(".")[0] || host;
                if (!base) return host || "Lien";
                return base.charAt(0).toUpperCase() + base.slice(1);
            } catch {
                return "Lien";
            }
        };

    ns.euro =
        ns.euro ||
        function euro(n) {
            const v = Number(n || 0);
            return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
        };

    ns.sumCategory =
        ns.sumCategory ||
        function sumCategory(cat) {
            const items = cat?.items || [];
            let total = 0;
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                if (it?.hidden) continue;
                const qty = Number(it?.qty ?? 1) || 0;
                const price = Number(it?.price ?? 0) || 0;
                total += qty * price;
            }
            return total;
        };

    ns.sumSection =
        ns.sumSection ||
        function sumSection(section) {
            const cats = section?.categories || [];
            let total = 0;
            for (let i = 0; i < cats.length; i++) total += ns.sumCategory(cats[i]);
            return total;
        };

    // ========= URL (query string) en "clair" =========
    // ?title=...&expenses=JSON&revenues=JSON
    function safeParseJSON(str) {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }

    function baseState() {
        if (typeof ns.defaultState === "function") return ns.defaultState();
        return {
            meta: { title: "Budget prévisionnel", excelColor: "#6AA84F", excelExtraRows: 0 },
            expenses: { categories: [] },
            revenues: { categories: [] },
        };
    }

    function normalizeCats(rawCats) {
        if (!Array.isArray(rawCats)) return [];
        return rawCats
            .map((c) => {
                const items = Array.isArray(c?.items) ? c.items : [];
                return {
                    id: ns.uid(),
                    name: String(c?.name || "").trim(),
                    open: !!c?.open,
                    items: items.map((it) => ({
                        id: ns.uid(),
                        name: String(it?.name || "").trim(),
                        qty: Number(it?.qty ?? 1),
                        price: Number(it?.price ?? 0),
                        link: String(it?.link || "").trim(),
                        hidden: !!it?.hidden,
                    })),
                };
            })
            .filter((c) => c.name);
    }

    ns.stateToQuery = function stateToQuery(state) {
        const s = state || baseState();
        const title = (s.meta?.title || "").trim();

        const expenses = (s.expenses?.categories || []).map((c) => ({
            name: c.name || "",
            open: !!c.open,
            items: (c.items || []).map((it) => ({
                name: it.name || "",
                qty: it.qty ?? 1,
                price: it.price ?? 0,
                link: it.link || "",
                hidden: !!it.hidden,
            })),
        }));

        const revenues = (s.revenues?.categories || []).map((c) => ({
            name: c.name || "",
            open: !!c.open,
            items: (c.items || []).map((it) => ({
                name: it.name || "",
                qty: it.qty ?? 1,
                price: it.price ?? 0,
                link: it.link || "",
                hidden: !!it.hidden,
            })),
        }));

        const params = new URLSearchParams();
        if (title) params.set("title", title);
        params.set("expenses", JSON.stringify(expenses));
        params.set("revenues", JSON.stringify(revenues));
        return `?${params.toString()}`;
    };

    ns.stateFromQuery = function stateFromQuery(search) {
        try {
            const sp = new URLSearchParams(search || window.location.search || "");
            if (!sp.has("expenses") && !sp.has("revenues") && !sp.has("title")) return null;

            const base = baseState();
            const title = sp.get("title");
            const expRaw = safeParseJSON(sp.get("expenses") || "[]");
            const revRaw = safeParseJSON(sp.get("revenues") || "[]");

            if (expRaw === null && sp.has("expenses")) return null;
            if (revRaw === null && sp.has("revenues")) return null;

            return {
                meta: {
                    ...base.meta,
                    title: (title || base.meta.title || "").trim() || base.meta.title,
                },
                expenses: { categories: normalizeCats(expRaw || []) },
                revenues: { categories: normalizeCats(revRaw || []) },
            };
        } catch {
            return null;
        }
    };

    ns.hasMeaningfulData = function hasMeaningfulData(state) {
        const s = state || baseState();
        const hasCats =
            (s.expenses?.categories?.length || 0) > 0 || (s.revenues?.categories?.length || 0) > 0;
        const baseTitle = (baseState().meta.title || "").trim();
        const title = (s.meta?.title || "").trim();
        const titleChanged = title && title !== baseTitle;
        return hasCats || titleChanged;
    };
})(window.BudgetApp);
