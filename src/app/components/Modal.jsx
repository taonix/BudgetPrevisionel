window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    // Fix: certains fichiers utilisaient `open`, d'autres `isOpen`.
    // Ce composant supporte les deux et ne rend RIEN quand fermé (pas d'overlay invisible).
    ns.Modal = function Modal({
                                  open,
                                  isOpen,
                                  title = "",
                                  tone = "red",
                                  onClose,
                                  children,
                              }) {
        const shown = !!(open ?? isOpen);
        const soft = tone === "green" ? "bg-[var(--green-soft)]" : "bg-[var(--red-soft)]";
        const soft2 = tone === "green" ? "bg-[var(--green-soft-2)]" : "bg-[var(--red-soft-2)]";

        React.useEffect(() => {
            if (!shown) return;
            const onKey = (e) => {
                if (e.key === "Escape") onClose?.();
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }, [shown, onClose]);

        if (!shown) return null;

        return (
            <div className="fixed inset-0 z-[60]">
                <div
                    className="absolute inset-0 bg-black/15"
                    onMouseDown={() => onClose?.()}
                    aria-hidden="true"
                />
                <div className="absolute inset-0 grid place-items-center p-6">
                    <div
                        className={`w-full max-w-[640px] rounded-[16px] overflow-hidden ${soft}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={`px-5 py-4 flex items-center justify-between ${soft2}`}>
                            <div className="font-extrabold text-base text-black">{title}</div>
                            <button
                                type="button"
                                className="h-8 w-8 rounded-full grid place-items-center hover:bg-black/5"
                                onClick={() => onClose?.()}
                                aria-label="Fermer"
                                title="Fermer"
                            >
                                <i className="bi bi-x-lg text-xs text-black"></i>
                            </button>
                        </div>
                        <div className="p-5">{children}</div>
                    </div>
                </div>
            </div>
        );
    };
})(window.BudgetApp);
