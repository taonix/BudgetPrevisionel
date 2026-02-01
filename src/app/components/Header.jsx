window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const { Download } = ns.Btn;

    ns.Header = function Header({
                                    title,
                                    onEditTitle,
                                    onOpenExcelExport,
                                    onExportJSON,
                                    onImportJSON,
                                }) {
        const importRef = React.useRef(null);

        return (
            <div className="flex items-start justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{title}</h1>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-[12px] border border-black/15 hover:bg-black/5 active:scale-[.99]"
                            onClick={onEditTitle}
                            title="Éditer"
                        >
                            <i className="bi bi-pencil-fill text-sm"></i>
                            <span className="text-sm font-semibold">Editer</span>
                        </button>
                    </div>
                    <div className="text-sm text-black/35 mt-1">Générateur de budget prévisionnel</div>
                </div>

                <div className="flex items-center gap-3">
                    <Download icon="bi bi-file-earmark-spreadsheet" onClick={onOpenExcelExport}>
                        Export Excel
                    </Download>

                    <Download icon="bi bi-upload" onClick={onExportJSON}></Download>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[12px] bg-black text-white text-sm font-semibold hover:brightness-95 active:scale-[.99]"
                        onClick={() => importRef.current?.click()}
                    >
                        <i className="bi bi-download"></i>
                    </button>

                    <input
                        ref={importRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => onImportJSON?.(e.target.files?.[0] || null)}
                    />
                </div>
            </div>
        );
    };
})(window.BudgetApp);
