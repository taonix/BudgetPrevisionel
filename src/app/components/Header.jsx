window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const { Download } = ns.Btn;

    ns.Header = function Header({
                                    title,
                                    onEditTitle,
                                    onOpenExcelExport,
                                    onExportJSON,
                                    onImportJSON,
                                    onShare,
                                }) {
        const importRef = React.useRef(null);

        return (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                <div className="min-w-0">
                    <div className="flex items-start gap-3">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.02em] leading-tight break-words">
                            {title}
                        </h1>
                        <button
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-[12px] border border-black/15 hover:bg-black/5 active:scale-[.99] shrink-0"
                            onClick={onEditTitle}
                            title="Éditer"
                            type="button"
                        >
                            <i className="bi bi-pencil-fill text-sm"></i>
                            <span className="text-sm font-semibold">Editer</span>
                        </button>
                    </div>
                    <div className="text-sm text-black/35 mt-1">Générateur de budget prévisionnel</div>
                </div>

                <div className="flex items-center justify-end gap-3 flex-wrap md:flex-nowrap">
                    <Download icon="bi bi-file-earmark-spreadsheet" onClick={onOpenExcelExport}>
                        Export Excel
                    </Download>

                    <Download icon="bi bi-share" onClick={onShare}>
                        Partager
                    </Download>

                    <Download icon="bi bi-upload" onClick={onExportJSON}></Download>

                    <button
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[12px] bg-black text-white text-sm font-semibold hover:brightness-95 active:scale-[.99]"
                        onClick={() => importRef.current?.click()}
                        type="button"
                        title="Importer JSON"
                    >
                        <i className="bi bi-download"></i>
                    </button>

                    <input
                        ref={importRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (f) onImportJSON?.(f);
                            // ✅ permet de ré-importer le même fichier + évite certains bugs de non-trigger
                            e.target.value = "";
                        }}
                    />
                </div>
            </div>
        );
    };
})(window.BudgetApp);
