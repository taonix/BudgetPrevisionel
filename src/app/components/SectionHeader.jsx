window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.SectionHeader = function SectionHeader({ label, tone, onAddCategory, onClear }) {
        const pillBg = tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]";
        const soft2 = tone === "green" ? "bg-[var(--green-soft-2)]" : "bg-[var(--red-soft-2)]";
        const accent = tone === "green" ? "text-[var(--green)]" : "text-[var(--red)]";

        return (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className={`inline-flex items-center h-9 px-4 rounded-[12px] ${pillBg} text-white font-extrabold w-fit`}>
                    {label}
                </div>

                <div className="flex items-center justify-end gap-3 flex-wrap md:flex-nowrap">
                    {onClear ? (
                        <button
                            className={`inline-flex items-center gap-2 h-8 px-3 rounded-[12px] ${soft2} ${accent} font-extrabold hover:brightness-95 active:scale-[.99]`}
                            onClick={onClear}
                            type="button"
                        >
                            <i className="bi bi-trash3"></i>
                            <span>Clear</span>
                        </button>
                    ) : null}

                    <button
                        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[12px] ${soft2} ${accent} font-extrabold hover:brightness-95 active:scale-[.99]`}
                        onClick={onAddCategory}
                        type="button"
                    >
                        <i className="bi bi-plus-lg"></i>
                        <span>Ajouter une catégorie</span>
                    </button>
                </div>
            </div>
        );
    };
})(window.BudgetApp);
