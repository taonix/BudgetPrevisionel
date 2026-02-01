window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.uid = () =>
        (crypto?.randomUUID?.() || Math.random().toString(16).slice(2)) + "";

    ns.euro = (n) =>
        (Number.isFinite(n) ? n : 0).toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
        });

    ns.clampInt = (v, min = 1) => {
        const x = parseInt(String(v ?? "").replace(",", "."), 10);
        return Number.isFinite(x) ? Math.max(min, x) : min;
    };

    ns.clampFloat = (v, min = 0) => {
        const x = parseFloat(String(v ?? "").replace(",", "."));
        return Number.isFinite(x) ? Math.max(min, x) : min;
    };

    ns.sumCategory = (cat) =>
        cat.items
            .filter((i) => !i.hidden)
            .reduce((acc, i) => acc + (i.qty || 0) * (i.price || 0), 0);

    ns.sumSection = (section) =>
        section.categories.reduce((acc, c) => acc + ns.sumCategory(c), 0);

    ns.normalizeUrl = (raw) => {
        const s = String(raw || "").trim();
        if (!s) return "";
        if (/^https?:\/\//i.test(s)) return s;
        return "https://" + s;
    };

    ns.siteLabel = (raw) => {
        const s = String(raw || "").trim();
        if (!s) return "";
        let host = "";
        try {
            host = new URL(ns.normalizeUrl(s)).hostname || "";
        } catch {
            host = s.replace(/^https?:\/\//i, "").split("/")[0] || s;
        }
        host = host.replace(/^www\./i, "").toLowerCase();

        const map = [
            { k: "amazon.", v: "Amazon" },
            { k: "fnac.", v: "Fnac" },
            { k: "ikea.", v: "IKEA" },
            { k: "decathlon.", v: "Decathlon" },
            { k: "leclerc", v: "E.Leclerc" },
            { k: "carrefour", v: "Carrefour" },
            { k: "cdiscount", v: "Cdiscount" },
            { k: "temu", v: "Temu" },
            { k: "aliexpress", v: "AliExpress" },
            { k: "shein", v: "SHEIN" },
            { k: "hiaks", v: "Hiaks" },
            { k: "livres", v: "Livres" },
        ];
        for (const m of map) {
            if (host.includes(m.k)) return m.v;
        }

        const parts = host.split(".").filter(Boolean);
        if (parts.length === 0) return "";
        const root = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
        return root ? root[0].toUpperCase() + root.slice(1) : host;
    };
})(window.BudgetApp);
