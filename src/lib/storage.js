window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const LS_KEY = "budget_app_v3";

    ns.defaultState = function defaultState() {
        const now = new Date();
        const mois = now.toLocaleDateString("fr-FR", { month: "long" });
        const an = now.getFullYear();
        return {
            meta: {
                title: `Budget Prévisionnel de ${mois[0].toUpperCase() + mois.slice(1)} ${an}`,
                excelColor: "#6AA84F",
                excelExtraRows: 0,
            },
            expenses: { categories: [] },
            revenues: { categories: [] },
        };
    };

    ns.loadState = function loadState() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return ns.defaultState();
            const parsed = JSON.parse(raw);
            if (!parsed?.expenses?.categories || !parsed?.revenues?.categories) return ns.defaultState();
            parsed.meta = parsed.meta || {};
            if (!parsed.meta.title) parsed.meta.title = ns.defaultState().meta.title;
            if (!parsed.meta.excelColor) parsed.meta.excelColor = "#6AA84F";
            if (parsed.meta.excelExtraRows === undefined || parsed.meta.excelExtraRows === null) parsed.meta.excelExtraRows = 0;
            return parsed;
        } catch {
            return ns.defaultState();
        }
    };

    ns.saveState = function saveState(st) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(st));
        } catch {}
    };
})(window.BudgetApp);
