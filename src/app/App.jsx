window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const { Modal } = ns;
    const { Text } = ns.Field;
    const { Header, SectionHeader, CategoryBlock, ContextMenu } = ns;

    function base64UrlEncode(str) {
        const bytes = new TextEncoder().encode(str);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    function base64UrlDecode(b64url) {
        const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    function normalizeState(parsed) {
        if (!parsed?.expenses?.categories || !parsed?.revenues?.categories) return null;
        parsed.meta = parsed.meta || {};
        if (!parsed.meta.title) parsed.meta.title = ns.defaultState().meta.title;
        if (!parsed.meta.excelColor) parsed.meta.excelColor = "#6AA84F";
        if (parsed.meta.excelExtraRows === undefined || parsed.meta.excelExtraRows === null) parsed.meta.excelExtraRows = 0;
        return parsed;
    }

    function getStateFromUrl() {
        try {
            const url = new URL(window.location.href);
            const data = url.searchParams.get("data");
            if (!data) return null;
            const json = base64UrlDecode(data);
            const parsed = JSON.parse(json);
            return normalizeState(parsed);
        } catch {
            return null;
        }
    }

    function setUrlFromState(st) {
        const url = new URL(window.location.href);
        url.searchParams.set("data", base64UrlEncode(JSON.stringify(st)));
        window.history.replaceState({}, "", url.toString());
        return url.toString();
    }

    ns.App = function App() {
        const urlSyncRef = React.useRef(false);

        const [state, setState] = React.useState(() => {
            const fromUrl = getStateFromUrl();
            if (fromUrl) {
                urlSyncRef.current = true;
                return fromUrl;
            }
            return ns.loadState();
        });

        React.useEffect(() => {
            ns.saveState(state);
            if (urlSyncRef.current) setUrlFromState(state);
        }, [state]);

        const expTotal = React.useMemo(() => ns.sumSection(state.expenses), [state.expenses]);
        const revTotal = React.useMemo(() => ns.sumSection(state.revenues), [state.revenues]);
        const result = React.useMemo(() => revTotal - expTotal, [revTotal, expTotal]);

        const [titleModal, setTitleModal] = React.useState(false);
        const [tmpTitle, setTmpTitle] = React.useState(state.meta.title);
        React.useEffect(() => setTmpTitle(state.meta.title), [state.meta.title]);

        const [catModal, setCatModal] = React.useState({ open: false, tone: "red", section: "expenses" });
        const [catName, setCatName] = React.useState("");

        const [itemModal, setItemModal] = React.useState({
            open: false,
            tone: "red",
            section: "expenses",
            catId: null,
            editItemId: null,
        });
        const [itemForm, setItemForm] = React.useState({ name: "", qty: 1, price: 0, link: "" });

        const [ctx, setCtx] = React.useState({
            open: false,
            x: 0,
            y: 0,
            kind: null,
            tone: "red",
            section: null,
            catId: null,
            itemId: null,
        });
        const closeCtx = () => setCtx((c) => ({ ...c, open: false }));

        const [excelModal, setExcelModal] = React.useState(false);
        const [excelColor, setExcelColor] = React.useState(state.meta.excelColor || "#6AA84F");
        const [excelExtraRows, setExcelExtraRows] = React.useState(
            Number.isFinite(state.meta.excelExtraRows) ? state.meta.excelExtraRows : 0
        );

        const [renameModal, setRenameModal] = React.useState({ open: false, tone: "red", section: null, catId: null });
        const [renameValue, setRenameValue] = React.useState("");

        const [delCatModal, setDelCatModal] = React.useState({ open: false, tone: "red", section: null, catId: null });
        const delCatName = React.useMemo(() => {
            if (!delCatModal.open) return "";
            return state[delCatModal.section]?.categories?.find((c) => c.id === delCatModal.catId)?.name || "";
        }, [delCatModal, state]);

        const [clearModal, setClearModal] = React.useState({ open: false, tone: "red", section: null });

        React.useEffect(() => setExcelColor(state.meta.excelColor || "#6AA84F"), [state.meta.excelColor]);
        React.useEffect(
            () => setExcelExtraRows(Number.isFinite(state.meta.excelExtraRows) ? state.meta.excelExtraRows : 0),
            [state.meta.excelExtraRows]
        );

        React.useEffect(() => {
            const onDown = (e) => {
                if (!ctx.open) return;
                const menu = document.getElementById("ctxmenu");
                if (menu && menu.contains(e.target)) return;
                closeCtx();
            };
            const onScroll = () => ctx.open && closeCtx();
            const onResize = () => ctx.open && closeCtx();
            window.addEventListener("mousedown", onDown, true);
            window.addEventListener("scroll", onScroll, true);
            window.addEventListener("resize", onResize);
            return () => {
                window.removeEventListener("mousedown", onDown, true);
                window.removeEventListener("scroll", onScroll, true);
                window.removeEventListener("resize", onResize);
            };
        }, [ctx.open]);

        React.useEffect(() => {
            const killNative = (e) => {
                if (e.target.closest("[data-ctx='item'],[data-ctx='cat']")) e.preventDefault();
            };
            document.addEventListener("contextmenu", killNative);
            return () => document.removeEventListener("contextmenu", killNative);
        }, []);

        const toggleCat = (section, catId) => {
            setState((s) => {
                const next = structuredClone(s);
                const cat = next[section].categories.find((c) => c.id === catId);
                if (!cat) return s;
                cat.open = !cat.open;
                return next;
            });
        };

        const openAddCategory = (tone, section) => {
            setCatName("");
            setCatModal({ open: true, tone, section });
            closeCtx();
        };

        const addCategory = () => {
            const name = catName.trim();
            if (!name) return;
            setState((s) => {
                const next = structuredClone(s);
                next[catModal.section].categories.unshift({ id: ns.uid(), name, open: true, items: [] });
                return next;
            });
            setCatModal({ open: false, tone: "red", section: "expenses" });
        };

        const openAddItem = (tone, section, catId) => {
            setItemForm({ name: "", qty: 1, price: 0, link: "" });
            setItemModal({ open: true, tone, section, catId, editItemId: null });
            closeCtx();
        };

        const openEditItem = (tone, section, catId, itemId) => {
            const cat = state[section].categories.find((c) => c.id === catId);
            const it = cat?.items.find((i) => i.id === itemId);
            if (!it) return;
            setItemForm({ name: it.name, qty: it.qty ?? 1, price: it.price ?? 0, link: it.link ?? "" });
            setItemModal({ open: true, tone, section, catId, editItemId: itemId });
            closeCtx();
        };

        const upsertItem = () => {
            const name = itemForm.name.trim();
            const qty = ns.clampInt(itemForm.qty, 1);
            const price = ns.clampFloat(itemForm.price, 0);
            const link = itemForm.link.trim();
            if (!name) return;

            setState((s) => {
                const next = structuredClone(s);
                const cat = next[itemModal.section].categories.find((c) => c.id === itemModal.catId);
                if (!cat) return s;

                if (itemModal.editItemId) {
                    const it = cat.items.find((i) => i.id === itemModal.editItemId);
                    if (!it) return s;
                    it.name = name;
                    it.qty = qty;
                    it.price = price;
                    it.link = link;
                } else {
                    cat.items.push({ id: ns.uid(), name, qty, price, link, hidden: false });
                }
                return next;
            });

            setItemModal({ open: false, tone: "red", section: "expenses", catId: null, editItemId: null });
        };

        const toggleHiddenItem = (section, catId, itemId) => {
            setState((s) => {
                const next = structuredClone(s);
                const cat = next[section].categories.find((c) => c.id === catId);
                const it = cat?.items.find((i) => i.id === itemId);
                if (!it) return s;

                it.hidden = !it.hidden;
                cat.items = cat.items.filter((x) => x.id !== itemId);

                if (it.hidden) cat.items.push(it);
                else {
                    const firstHiddenIdx = cat.items.findIndex((x) => x.hidden);
                    if (firstHiddenIdx === -1) cat.items.push(it);
                    else cat.items.splice(firstHiddenIdx, 0, it);
                }
                return next;
            });
            closeCtx();
        };

        const deleteItem = (section, catId, itemId) => {
            setState((s) => {
                const next = structuredClone(s);
                const cat = next[section].categories.find((c) => c.id === catId);
                if (!cat) return s;
                cat.items = cat.items.filter((i) => i.id !== itemId);
                return next;
            });
            closeCtx();
        };

        const openRenameCategory = (section, catId, tone) => {
            const current = state[section].categories.find((c) => c.id === catId)?.name || "";
            setRenameValue(current);
            setRenameModal({ open: true, tone, section, catId });
            closeCtx();
        };

        const commitRenameCategory = () => {
            const trimmed = renameValue.trim();
            if (!trimmed) return;
            setState((s) => {
                const next = structuredClone(s);
                const cat = next[renameModal.section].categories.find((c) => c.id === renameModal.catId);
                if (!cat) return s;
                cat.name = trimmed;
                return next;
            });
            setRenameModal({ open: false, tone: "red", section: null, catId: null });
        };

        const openDeleteCategory = (section, catId, tone) => {
            setDelCatModal({ open: true, tone, section, catId });
            closeCtx();
        };

        const commitDeleteCategory = () => {
            setState((s) => {
                const next = structuredClone(s);
                next[delCatModal.section].categories = next[delCatModal.section].categories.filter((c) => c.id !== delCatModal.catId);
                return next;
            });
            setDelCatModal({ open: false, tone: "red", section: null, catId: null });
        };

        const openCtxItem = (e, tone, section, catId, itemId) => {
            e.preventDefault();
            e.stopPropagation();
            setCtx({ open: true, x: e.clientX, y: e.clientY, kind: "item", tone, section, catId, itemId });
        };

        const openCtxCat = (e, tone, section, catId) => {
            e.preventDefault();
            e.stopPropagation();
            setCtx({ open: true, x: e.clientX, y: e.clientY, kind: "cat", tone, section, catId, itemId: null });
        };

        const currentItem = React.useMemo(() => {
            if (!ctx.open || ctx.kind !== "item") return null;
            const cat = state[ctx.section]?.categories?.find((c) => c.id === ctx.catId);
            return cat?.items?.find((i) => i.id === ctx.itemId) || null;
        }, [ctx, state]);

        const currentItemHidden = !!currentItem?.hidden;

        const exportJSON = () => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safe = (state.meta.title || "Budget").replace(/[\\/:*?"<>|]+/g, "-");
            a.download = `${safe}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        };

        const importJSON = async (file) => {
            if (!file) return;
            try {
                const txt = await file.text();
                const parsed = normalizeState(JSON.parse(txt));
                if (!parsed) return;
                urlSyncRef.current = true;
                setState(parsed);
            } catch {}
        };

        const openExcelExport = () => {
            setExcelColor(state.meta.excelColor || "#6AA84F");
            setExcelExtraRows(Number.isFinite(state.meta.excelExtraRows) ? state.meta.excelExtraRows : 0);
            setExcelModal(true);
        };

        const doExcelExport = () => {
            const extra = Math.max(0, Math.min(200, parseInt(excelExtraRows, 10) || 0));
            const color = excelColor || "#6AA84F";
            const next = structuredClone(state);
            next.meta = next.meta || {};
            next.meta.excelColor = color;
            next.meta.excelExtraRows = extra;
            setState(next);
            ns.downloadExcel(next);
            setExcelModal(false);
        };

        const openClear = (tone, section) => setClearModal({ open: true, tone, section });
        const commitClear = () => {
            setState((s) => {
                const next = structuredClone(s);
                next[clearModal.section].categories = [];
                return next;
            });
            setClearModal({ open: false, tone: "red", section: null });
        };

        const commitTitle = () => {
            const t = tmpTitle.trim();
            if (!t) return;
            setState((s) => {
                const next = structuredClone(s);
                next.meta = next.meta || {};
                next.meta.title = t;
                return next;
            });
            setTitleModal(false);
        };

        const closeCatModal = () => setCatModal({ open: false, tone: "red", section: "expenses" });
        const closeItemModal = () => setItemModal({ open: false, tone: "red", section: "expenses", catId: null, editItemId: null });

        const isExpenseItem = itemModal.section === "expenses";
        const itemVerb = itemModal.editItemId ? "Modifier" : "Ajouter";
        const itemNoun = isExpenseItem ? "une dépense" : "une recette";

        const onShare = async () => {
            try {
                urlSyncRef.current = true;
                const shareUrl = setUrlFromState(state);
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(shareUrl);
                } else {
                    prompt("Copie l’URL :", shareUrl);
                }
            } catch {}
        };

        return (
            <div className="min-h-screen">
                <div className="max-w-[1480px] mx-auto px-8 pt-10 pb-24">
                    <Header
                        title={state.meta.title}
                        onEditTitle={() => setTitleModal(true)}
                        onOpenExcelExport={openExcelExport}
                        onExportJSON={exportJSON}
                        onImportJSON={importJSON}
                        onShare={onShare}
                    />

                    <div className="mt-10">
                        <SectionHeader
                            label="Dépenses"
                            tone="red"
                            onAddCategory={() => openAddCategory("red", "expenses")}
                            onClear={() => openClear("red", "expenses")}
                        />
                        <div className="mt-4 space-y-4">
                            {state.expenses.categories.map((cat) => (
                                <CategoryBlock
                                    key={cat.id}
                                    tone="red"
                                    cat={cat}
                                    total={ns.sumCategory(cat)}
                                    onToggle={() => toggleCat("expenses", cat.id)}
                                    onAddItem={() => openAddItem("red", "expenses", cat.id)}
                                    addLabel="Ajouter une dépense"
                                    onItemContext={(e, it) => openCtxItem(e, "red", "expenses", cat.id, it.id)}
                                    onCatContext={(e) => openCtxCat(e, "red", "expenses", cat.id)}
                                />
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div
                                className="inline-flex items-center h-11 px-6 pill bg-[var(--red)] text-white text-[18px] font-black">
                                {ns.euro(expTotal)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <SectionHeader
                            label="Recettes"
                            tone="green"
                            onAddCategory={() => openAddCategory("green", "revenues")}
                            onClear={() => openClear("green", "revenues")}
                        />
                        <div className="mt-4 space-y-4">
                            {state.revenues.categories.map((cat) => (
                                <CategoryBlock
                                    key={cat.id}
                                    tone="green"
                                    cat={cat}
                                    total={ns.sumCategory(cat)}
                                    onToggle={() => toggleCat("revenues", cat.id)}
                                    onAddItem={() => openAddItem("green", "revenues", cat.id)}
                                    addLabel="Ajouter une recette"
                                    onItemContext={(e, it) => openCtxItem(e, "green", "revenues", cat.id, it.id)}
                                    onCatContext={(e) => openCtxCat(e, "green", "revenues", cat.id)}
                                />
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div
                                className="inline-flex items-center h-11 px-6 pill bg-[var(--green)] text-white text-[18px] font-black">
                                {ns.euro(revTotal)}
                            </div>
                        </div>
                    </div>

                    <div className="fixed right-6 bottom-6">
                        <div className="bg-black text-white rounded-[12px] px-5 py-4 border border-white/10">
                            <div className="text-[11px] opacity-80 font-semibold">Résultat</div>
                            <div className="text-[22px] font-black tracking-[-0.02em]">
                                {result >= 0 ? "+" : "-"}
                                {ns.euro(Math.abs(result))}
                            </div>
                        </div>
                    </div>

                    <ContextMenu
                        ctx={ctx}
                        closeCtx={closeCtx}
                        currentItem={currentItem}
                        currentItemHidden={currentItemHidden}
                        onEditItem={() => openEditItem(ctx.tone, ctx.section, ctx.catId, ctx.itemId)}
                        onToggleHideItem={() => toggleHiddenItem(ctx.section, ctx.catId, ctx.itemId)}
                        onDeleteItem={() => deleteItem(ctx.section, ctx.catId, ctx.itemId)}
                        onRenameCat={() => openRenameCategory(ctx.section, ctx.catId, ctx.tone)}
                        onDeleteCat={() => openDeleteCategory(ctx.section, ctx.catId, ctx.tone)}
                    />

                    {/* ✅ MODALS MANQUANTS (cause du bug) */}

                    <Modal open={titleModal} title="Modifier le nom du budget" onClose={() => setTitleModal(false)}
                           tone="red">
                        <div className="space-y-4">
                            <Text label="Nom du budget" value={tmpTitle} onChange={setTmpTitle} required/>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={() => setTitleModal(false)}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className="h-10 px-6 rounded-[14px] bg-black text-white font-black hover:brightness-95 active:scale-[.99]"
                                    onClick={commitTitle}
                                    type="button"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </Modal>

                    <Modal open={catModal.open} title="Ajouter une catégorie" onClose={closeCatModal}
                           tone={catModal.tone}>
                        <div className="space-y-4">
                            <Text label="Nom de la catégorie" value={catName} onChange={setCatName} required/>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={closeCatModal}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`h-10 px-6 rounded-[14px] text-white font-black hover:brightness-95 active:scale-[.99] ${
                                        catModal.tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]"
                                    }`}
                                    onClick={addCategory}
                                    type="button"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </Modal>

                    <Modal open={itemModal.open} title={`${itemVerb} ${itemNoun}`} onClose={closeItemModal}
                           tone={itemModal.tone}>
                        <div className="space-y-4">
                            <Text
                                label="Nom"
                                value={itemForm.name}
                                onChange={(v) => setItemForm((f) => ({...f, name: v}))}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Text
                                    label="Quantité"
                                    type="number"
                                    rightHint=">= 1"
                                    value={String(itemForm.qty)}
                                    onChange={(v) => setItemForm((f) => ({...f, qty: v}))}
                                    required
                                />
                                <Text
                                    label="Prix unitaire"
                                    type="number"
                                    rightHint=">= 0"
                                    value={String(itemForm.price)}
                                    onChange={(v) => setItemForm((f) => ({...f, price: v}))}
                                    required
                                />
                            </div>
                            <Text
                                label="Lien (optionnel)"
                                value={itemForm.link}
                                onChange={(v) => setItemForm((f) => ({...f, link: v}))}
                                placeholder="https://..."
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={closeItemModal}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`h-10 px-6 rounded-[14px] text-white font-black hover:brightness-95 active:scale-[.99] ${
                                        itemModal.tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]"
                                    }`}
                                    onClick={upsertItem}
                                    type="button"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        open={renameModal.open}
                        title="Renommer la catégorie"
                        onClose={() => setRenameModal({open: false, tone: "red", section: null, catId: null})}
                        tone={renameModal.tone}
                    >
                        <div className="space-y-4">
                            <Text label="Nouveau nom" value={renameValue} onChange={setRenameValue} required/>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={() => setRenameModal({
                                        open: false,
                                        tone: "red",
                                        section: null,
                                        catId: null
                                    })}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`h-10 px-6 rounded-[14px] text-white font-black hover:brightness-95 active:scale-[.99] ${
                                        renameModal.tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]"
                                    }`}
                                    onClick={commitRenameCategory}
                                    type="button"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </Modal>

                    <Modal open={excelModal} title="Exporter en Excel" onClose={() => setExcelModal(false)}
                           tone="green">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm font-medium text-black/70">Couleur Excel</div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={excelColor}
                                            onChange={(e) => setExcelColor(e.target.value)}
                                            className="h-11 w-14 rounded-[14px] border border-black/15 p-1"
                                        />
                                        <input
                                            type="text"
                                            value={excelColor}
                                            onChange={(e) => setExcelColor(e.target.value)}
                                            className="h-11 flex-1 rounded-[14px] border border-black/15 px-4 outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                    </div>
                                </label>

                                <Text
                                    label="Lignes supplémentaires"
                                    type="number"
                                    rightHint="0 - 200"
                                    value={String(excelExtraRows)}
                                    onChange={setExcelExtraRows}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={() => setExcelModal(false)}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className="h-10 px-6 rounded-[14px] bg-black text-white font-black hover:brightness-95 active:scale-[.99]"
                                    onClick={doExcelExport}
                                    type="button"
                                >
                                    Télécharger
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Delete category modal */}
                    <Modal
                        open={delCatModal.open}
                        title="Supprimer la catégorie"
                        onClose={() => setDelCatModal({open: false, tone: "red", section: null, catId: null})}
                        tone={delCatModal.tone}
                    >
                        <div className="space-y-4">
                            <div className="text-sm text-black/60">
                                Supprimer <span
                                className="font-extrabold text-black">{delCatName || "cette catégorie"}</span> et toutes
                                ses lignes ?
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={() => setDelCatModal({
                                        open: false,
                                        tone: "red",
                                        section: null,
                                        catId: null
                                    })}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`h-10 px-6 rounded-[14px] text-white font-black hover:brightness-95 active:scale-[.99] ${
                                        delCatModal.tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]"
                                    }`}
                                    onClick={commitDeleteCategory}
                                    type="button"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Clear section modal */}
                    <Modal
                        open={clearModal.open}
                        title="Tout effacer"
                        onClose={() => setClearModal({open: false, tone: "red", section: null})}
                        tone={clearModal.tone}
                    >
                        <div className="space-y-4">
                            <div className="text-sm text-black/60">
                                Tout effacer dans <span
                                className="font-extrabold text-black">{clearModal.section === "revenues" ? "Recettes" : "Dépenses"}</span> ?
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="h-10 px-4 rounded-[14px] border border-black/15 hover:bg-black/5 font-semibold"
                                    onClick={() => setClearModal({open: false, tone: "red", section: null})}
                                    type="button"
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`h-10 px-6 rounded-[14px] text-white font-black hover:brightness-95 active:scale-[.99] ${
                                        clearModal.tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]"
                                    }`}
                                    onClick={commitClear}
                                    type="button"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </Modal>
                    <div className={'w-full justify-center items-center'}>
                        <a href={"https://github.com/taonix"}>Made by Aubin</a>
                    </div>
                </div>
            </div>
        );
    };
})(window.BudgetApp);
