window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const { LinkTag } = ns.Btn;

    ns.CategoryBlock = function CategoryBlock({
                                                  tone,
                                                  cat,
                                                  total,
                                                  onToggle,
                                                  onAddItem,
                                                  addLabel = "Ajouter une ligne",
                                                  onItemContext,
                                                  onCatContext,
                                              }) {
        const softA = tone === "green" ? "bg-[rgba(85,181,15,.10)]" : "bg-[rgba(184,0,0,.10)]";
        const softB = tone === "green" ? "bg-[rgba(85,181,15,.04)]" : "bg-[rgba(184,0,0,.04)]";
        const softHeader = tone === "green" ? "bg-[var(--green-soft-2)]" : "bg-[var(--red-soft-2)]";
        const accent = tone === "green" ? "text-[var(--green)]" : "text-[var(--red)]";
        const caret = cat.open ? "bi bi-chevron-down" : "bi bi-chevron-right";

        const shown = cat.items.filter((i) => !i.hidden);
        const hidden = cat.items.filter((i) => i.hidden);
        const all = [...shown, ...hidden];

        const addBtnBg = tone === "green" ? "bg-[rgba(85,181,15,.12)]" : "bg-[rgba(184,0,0,.12)]";
        const addBtnHover = tone === "green" ? "hover:bg-[rgba(85,181,15,.16)]" : "hover:bg-[rgba(184,0,0,.16)]";

        return (
            <div className="rounded-[14px] overflow-hidden bg-white">
                <div
                    className={`flex items-center justify-between px-5 py-4 ${softHeader}`}
                    onClick={onToggle}
                    onContextMenu={(e) => onCatContext(e)}
                    role="button"
                    tabIndex={0}
                    data-ctx="cat"
                >
                    <div className="flex items-center gap-3">
                        <i className={`${caret} ${accent} text-[13px]`}></i>
                        <div className="leading-tight">
                            <div className="font-extrabold text-[17px]">{cat.name}</div>
                            <div className={`text-xs ${accent} opacity-90`}>{cat.items.length} éléments</div>
                        </div>
                    </div>
                    <div className={`font-black ${accent}`}>{ns.euro(total)}</div>
                </div>

                {cat.open ? (
                    <div>
                        {all.map((it, idx) => {
                            const isHidden = it.hidden;
                            const lineAmount = (it.qty || 0) * (it.price || 0);

                            const zebra = idx % 2 === 0 ? softA : softB;
                            const rowBg = isHidden ? "bg-black/5" : zebra;

                            const textMain = isHidden ? "text-black/35" : "text-black";
                            const textPrice = isHidden ? "text-black/25" : accent;

                            const isLastRow = idx === all.length - 1;

                            return (
                                <div
                                    key={it.id}
                                    className={[
                                        "flex items-center justify-between gap-4 px-5 py-4",
                                        rowBg,
                                        isLastRow ? "rounded-b-[14px]" : "",
                                    ].join(" ")}
                                    onContextMenu={(e) => onItemContext(e, it)}
                                    data-ctx="item"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`${isHidden ? "text-black/25" : accent} font-extrabold text-xs shrink-0`}>
                                                x{it.qty || 1}
                                            </span>

                                            <div className="min-w-0">
                                                <div className={`truncate ${textMain}`}>{it.name}</div>

                                                {isHidden ? (
                                                    <div className={`text-xs mt-0.5 flex items-center gap-2 ${accent}`}>
                                                        <i className="bi bi-eye-slash"></i>
                                                        masqué
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {it.link ? <LinkTag tone={tone} url={it.link} disabled={isHidden} /> : null}
                                        <div className={`w-28 text-right font-black ${textPrice} ${isHidden ? "line-through" : ""}`}>
                                            {ns.euro(lineAmount)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex justify-end px-5 py-4 bg-white">
                            <button
                                type="button"
                                className={`inline-flex items-center gap-2 h-8 px-3 rounded-[10px] ${addBtnBg} ${accent} font-extrabold ${addBtnHover} active:scale-[.99]`}
                                onClick={onAddItem}
                            >
                                <i className="bi bi-plus-lg"></i>
                                <span>{addLabel}</span>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };
})(window.BudgetApp);
