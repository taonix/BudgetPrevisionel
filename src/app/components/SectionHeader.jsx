window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.SectionHeader = function SectionHeader({ label, tone, onAddCategory, onClear }) {
        const pillBg = tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]";
        const softCat = tone === "green" ? "bg-[rgba(85,181,15,.18)]" : "bg-[rgba(184,0,0,.18)]";
        const softClear = tone === "green" ? "bg-[rgba(85,181,15,.10)]" : "bg-[rgba(184,0,0,.10)]";
        const accent = tone === "green" ? "text-[var(--green)]" : "text-[var(--red)]";
        const hoverCat = tone === "green" ? "hover:bg-[rgba(85,181,15,.22)]" : "hover:bg-[rgba(184,0,0,.22)]";
        const hoverClear = tone === "green" ? "hover:bg-[rgba(85,181,15,.14)]" : "hover:bg-[rgba(184,0,0,.14)]";

        return (
            <div className="flex items-center justify-between">
                <div className={`inline-flex items-center h-9 px-4 rounded-[12px] ${pillBg} text-white font-extrabold`}>
                    {label}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[10px] ${softClear} ${accent} font-extrabold ${hoverClear} active:scale-[.99]`}
                        onClick={() => onClear?.()}
                        title="Tout effacer"
                    >
                        <i className="bi bi-trash3"></i>
                        <span>Tout effacer</span>
                    </button>

                    <button
                        type="button"
                        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[10px] ${softCat} ${accent} font-extrabold ${hoverCat} active:scale-[.99]`}
                        onClick={() => onAddCategory?.()}
                    >
                        <i className="bi bi-plus-lg"></i>
                        <span>Ajouter une catégorie</span>
                    </button>
                </div>
            </div>
        );
    };
})(window.BudgetApp);
