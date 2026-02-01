window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.ContextMenu = function ContextMenu({
                                              ctx,
                                              closeCtx,
                                              currentItem,
                                              currentItemHidden,
                                              onEditItem,
                                              onToggleHideItem,
                                              onDeleteItem,
                                              onRenameCat,
                                              onDeleteCat,
                                          }) {
        if (!ctx.open) return null;

        const soft = ctx.tone === "green" ? "bg-[var(--green-soft)]" : "bg-[var(--red-soft)]";
        const soft2 = ctx.tone === "green" ? "bg-[var(--green-soft-2)]" : "bg-[var(--red-soft-2)]";
        const accent = ctx.tone === "green" ? "text-[var(--green)]" : "text-[var(--red)]";
        const hover =
            ctx.tone === "green"
                ? "hover:bg-[rgba(78,161,15,.10)]"
                : "hover:bg-[rgba(184,0,0,.10)]";

        const ItemBtn = ({ icon, label, onClick, accentOnly }) => (
            <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] ${hover} active:scale-[.995]`}
                onClick={onClick}
                type="button"
            >
                <i className={`${icon} ${accentOnly ? accent : "text-black"}`}></i>
                <span className={`font-extrabold ${accentOnly ? accent : "text-black"}`}>{label}</span>
            </button>
        );

        return (
            <>
                {/* Backdrop visuel uniquement (ne bloque pas les clics) */}
                <div className="fixed inset-0 z-40 bg-black/15 pointer-events-none" aria-hidden="true" />

                <div id="ctxmenu" className="fixed z-50 ctx-pop" style={{ left: ctx.x, top: ctx.y }}>
                    <div className={`w-[280px] rounded-[14px] overflow-hidden ${soft}`}>
                        <div className={`px-4 py-3 flex items-center justify-between ${soft2}`}>
                            <div className="min-w-0">
                                <div className="truncate font-extrabold text-sm text-black">
                                    {ctx.kind === "item" ? currentItem?.name || "Ligne" : "Catégorie"}
                                </div>
                                {ctx.kind === "item" && currentItem?.link ? (
                                    <div className="text-xs text-black/55 flex items-center gap-2 mt-0.5">
                                        <i className="bi bi-link-45deg"></i>
                                        <span className="truncate">{ns.siteLabel(currentItem.link)}</span>
                                    </div>
                                ) : null}
                            </div>

                            <button
                                className="h-8 w-8 rounded-full grid place-items-center hover:bg-black/5"
                                onClick={closeCtx}
                                aria-label="Fermer"
                                title="Fermer"
                                type="button"
                            >
                                <i className="bi bi-x-lg text-xs text-black"></i>
                            </button>
                        </div>

                        <div className="p-2">
                            {ctx.kind === "item" ? (
                                <div className="space-y-1">
                                    <ItemBtn icon="bi bi-pencil-fill" label="Modifier" onClick={onEditItem} />
                                    <ItemBtn
                                        icon={currentItemHidden ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"}
                                        label={currentItemHidden ? "Démasquer" : "Masquer"}
                                        onClick={onToggleHideItem}
                                    />
                                    <ItemBtn icon="bi bi-trash3-fill" label="Supprimer" onClick={onDeleteItem} accentOnly />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <ItemBtn icon="bi bi-pencil-fill" label="Renommer" onClick={onRenameCat} />
                                    <ItemBtn icon="bi bi-trash3-fill" label="Supprimer" onClick={onDeleteCat} accentOnly />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };
})(window.BudgetApp);
