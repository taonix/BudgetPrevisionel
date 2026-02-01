window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    const XLSX = window.XLSX;

    const RGB = (hex) => ({ rgb: hex.replace("#", "").toUpperCase() });
    const fill = (hex) => ({ patternType: "solid", fgColor: RGB(hex) });
    const border = (l = "thin", r = "thin", t = "thin", b = "thin") => ({
        left: { style: l, color: RGB("#000000") },
        right: { style: r, color: RGB("#000000") },
        top: { style: t, color: RGB("#000000") },
        bottom: { style: b, color: RGB("#000000") },
    });

    const hexToRgb = (hex) => {
        const h = hex.replace("#", "").trim();
        const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
        const r = parseInt(n.slice(0, 2), 16);
        const g = parseInt(n.slice(2, 4), 16);
        const b = parseInt(n.slice(4, 6), 16);
        return { r, g, b };
    };

    const rgbToHex = ({ r, g, b }) =>
        "#" +
        [r, g, b]
            .map((x) => {
                const v = Math.max(0, Math.min(255, Math.round(x)));
                return v.toString(16).padStart(2, "0");
            })
            .join("");

    const mix = (a, b, t) => ({
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
    });

    const lighten = (hex, t) => rgbToHex(mix(hexToRgb(hex), { r: 255, g: 255, b: 255 }, t));
    const darken = (hex, t) => rgbToHex(mix(hexToRgb(hex), { r: 0, g: 0, b: 0 }, t));

    function getPalette(state) {
        const base = (state?.meta?.excelColor || "#6AA84F").toUpperCase();
        return {
            base,
            title: darken(base, 0.12),
            header: base,
            cat: lighten(base, 0.70),
            total: lighten(base, 0.55),
            alt: "#E8F0FE",
            white: "#FFFFFF",
        };
    }

    function makeStyles(p) {
        const linkFont = { color: RGB("#1155CC"), underline: true };
        return {
            title: {
                font: { bold: true, color: RGB("#FFFFFF"), sz: 12 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: fill(p.title),
                border: border("medium", "medium", "medium", "thin"),
            },
            header: {
                font: { bold: true, color: RGB("#FFFFFF") },
                alignment: { horizontal: "center", vertical: "center" },
                fill: fill(p.header),
                border: border("medium", "medium", "thin", "thin"),
            },
            subHeader: {
                font: { bold: true },
                alignment: { horizontal: "center", vertical: "center" },
                fill: fill(p.cat),
                border: border("thin", "thin", "thin", "thin"),
            },
            catRow: {
                font: { bold: true },
                alignment: { vertical: "center" },
                fill: fill(p.white),
                border: border("medium", "medium", "thin", "thin"),
            },
            text: (alt, isLink) => ({
                alignment: { vertical: "center" },
                fill: fill(alt ? p.alt : p.white),
                border: border("thin", "thin", "thin", "thin"),
                font: isLink ? linkFont : undefined,
            }),
            num: (alt) => ({
                alignment: { horizontal: "right", vertical: "center" },
                numFmt: '#,##0.00\\ [$€-1]',
                fill: fill(alt ? p.alt : p.white),
                border: border("thin", "thin", "thin", "thin"),
            }),
            int: (alt) => ({
                alignment: { horizontal: "center", vertical: "center" },
                numFmt: "0",
                fill: fill(alt ? p.alt : p.white),
                border: border("thin", "thin", "thin", "thin"),
            }),
            totalLbl: {
                font: { bold: true },
                alignment: { vertical: "center" },
                fill: fill(p.total),
                border: border("medium", "thin", "thin", "thin"),
            },
            totalNum: {
                font: { bold: true },
                alignment: { horizontal: "right", vertical: "center" },
                numFmt: '#,##0.00\\ [$€-1]',
                fill: fill(p.total),
                border: border("thin", "medium", "thin", "thin"),
            },
        };
    }

    function setCell(ws, addr, v, s, f, link) {
        const cell = ws[addr] || {};
        if (f) {
            cell.f = f;
            cell.t = "n";
            cell.v = cell.v ?? 0;
        } else {
            cell.v = v;
            cell.t = typeof v === "number" ? "n" : "s";
            delete cell.f;
        }
        if (s) cell.s = s;

        if (link) {
            const href = ns.normalizeUrl(link);
            cell.l = { Target: href, Tooltip: href };
            // force Excel to recognize it as a hyperlink (style + explicit string)
            cell.t = "s";
            cell.v = String(v ?? "");
        }
        ws[addr] = cell;
    }

    function addMerge(ws, a1, a2) {
        ws["!merges"] = ws["!merges"] || [];
        ws["!merges"].push(XLSX.utils.decode_range(`${a1}:${a2}`));
    }

    function buildSheet(state) {
        const palette = getPalette(state);
        const S = makeStyles(palette);
        const extraRows = Math.max(0, Math.min(200, parseInt(state?.meta?.excelExtraRows, 10) || 0));

        const ws = {};
        ws["!cols"] = [
            { wch: 2 },    // A (spacer)
            { wch: 34 },   // B exp name
            { wch: 7 },    // C exp qty
            { wch: 12 },   // D exp unit
            { wch: 13 },   // E exp total
            { wch: 2 },    // F (spacer)
            { wch: 34 },   // G rev name
            { wch: 7 },    // H rev qty
            { wch: 12 },   // I rev unit
            { wch: 13 },   // J rev total
        ];

        // Titles
        setCell(ws, "B4", state.meta.title, S.title);
        setCell(ws, "C4", "", S.title);
        setCell(ws, "D4", "", S.title);
        setCell(ws, "E4", "", S.title);
        addMerge(ws, "B4", "E4");

        setCell(ws, "G4", state.meta.title, S.title);
        setCell(ws, "H4", "", S.title);
        setCell(ws, "I4", "", S.title);
        setCell(ws, "J4", "", S.title);
        addMerge(ws, "G4", "J4");

        // Section headers
        setCell(ws, "B5", "Dépenses", S.header);
        setCell(ws, "C5", "", S.header);
        setCell(ws, "D5", "", S.header);
        setCell(ws, "E5", "", S.header);
        addMerge(ws, "B5", "E5");

        setCell(ws, "G5", "Recettes", S.header);
        setCell(ws, "H5", "", S.header);
        setCell(ws, "I5", "", S.header);
        setCell(ws, "J5", "", S.header);
        addMerge(ws, "G5", "J5");

        // Column headers
        setCell(ws, "B6", "Nom", S.subHeader);
        setCell(ws, "C6", "Qté", S.subHeader);
        setCell(ws, "D6", "PU", S.subHeader);
        setCell(ws, "E6", "Total", S.subHeader);

        setCell(ws, "G6", "Nom", S.subHeader);
        setCell(ws, "H6", "Qté", S.subHeader);
        setCell(ws, "I6", "PU", S.subHeader);
        setCell(ws, "J6", "Total", S.subHeader);

        let r = 7;

        const expTotals = [];
        const revTotals = [];

        const expCats = state.expenses.categories || [];
        const revCats = state.revenues.categories || [];

        const maxCats = Math.max(expCats.length, revCats.length);

        for (let ci = 0; ci < maxCats; ci++) {
            const ec = expCats[ci] || null;
            const rc = revCats[ci] || null;

            // Category row
            if (ec) {
                setCell(ws, `B${r}`, ec.name, S.catRow);
                setCell(ws, `C${r}`, "", S.catRow);
                setCell(ws, `D${r}`, "", S.catRow);
                setCell(ws, `E${r}`, "", S.catRow);
                addMerge(ws, `B${r}`, `E${r}`);
            } else {
                setCell(ws, `B${r}`, "", S.text(false));
                setCell(ws, `C${r}`, "", S.int(false));
                setCell(ws, `D${r}`, "", S.num(false));
                setCell(ws, `E${r}`, "", S.num(false));
            }

            if (rc) {
                setCell(ws, `G${r}`, rc.name, S.catRow);
                setCell(ws, `H${r}`, "", S.catRow);
                setCell(ws, `I${r}`, "", S.catRow);
                setCell(ws, `J${r}`, "", S.catRow);
                addMerge(ws, `G${r}`, `J${r}`);
            } else {
                setCell(ws, `G${r}`, "", S.text(false));
                setCell(ws, `H${r}`, "", S.int(false));
                setCell(ws, `I${r}`, "", S.num(false));
                setCell(ws, `J${r}`, "", S.num(false));
            }
            r++;

            const expStart = r;
            const revStart = r;

            const eItems = ec ? (ec.items || []).filter((i) => !i.hidden) : [];
            const rItems = rc ? (rc.items || []).filter((i) => !i.hidden) : [];
            const maxItems = Math.max(eItems.length + extraRows, rItems.length + extraRows);

            for (let k = 0; k < maxItems; k++) {
                const alt = k % 2 === 0;

                const ei = k < eItems.length ? eItems[k] : null;
                const ri = k < rItems.length ? rItems[k] : null;

                // Expenses line
                if (ec) {
                    const name = ei ? ei.name : "";
                    const qty = ei ? (ei.qty || 1) : 0;
                    const pu = ei ? (ei.price || 0) : 0;
                    const link = ei?.link ? ei.link : null;

                    setCell(ws, `B${r}`, name, S.text(alt, !!link), null, link);
                    setCell(ws, `C${r}`, qty, S.int(alt));
                    setCell(ws, `D${r}`, pu, S.num(alt));
                    setCell(ws, `E${r}`, 0, S.num(alt), `C${r}*D${r}`);
                } else {
                    setCell(ws, `B${r}`, "", S.text(alt));
                    setCell(ws, `C${r}`, "", S.int(alt));
                    setCell(ws, `D${r}`, "", S.num(alt));
                    setCell(ws, `E${r}`, "", S.num(alt));
                }

                // Revenues line
                if (rc) {
                    const name = ri ? ri.name : "";
                    const qty = ri ? (ri.qty || 1) : 0;
                    const pu = ri ? (ri.price || 0) : 0;
                    const link = ri?.link ? ri.link : null;

                    setCell(ws, `G${r}`, name, S.text(alt, !!link), null, link);
                    setCell(ws, `H${r}`, qty, S.int(alt));
                    setCell(ws, `I${r}`, pu, S.num(alt));
                    setCell(ws, `J${r}`, 0, S.num(alt), `H${r}*I${r}`);
                } else {
                    setCell(ws, `G${r}`, "", S.text(alt));
                    setCell(ws, `H${r}`, "", S.int(alt));
                    setCell(ws, `I${r}`, "", S.num(alt));
                    setCell(ws, `J${r}`, "", S.num(alt));
                }

                r++;
            }

            const expEnd = r - 1;
            const revEnd = r - 1;

            // Category totals row
            if (ec) {
                setCell(ws, `B${r}`, `Total ${ec.name}`, S.totalLbl);
                setCell(ws, `C${r}`, "", S.totalLbl);
                setCell(ws, `D${r}`, "", S.totalLbl);
                setCell(ws, `E${r}`, 0, S.totalNum, expEnd >= expStart ? `SUM(E${expStart}:E${expEnd})` : "0");
                addMerge(ws, `B${r}`, `D${r}`);
                expTotals.push(`E${r}`);
            } else {
                setCell(ws, `B${r}`, "", S.totalLbl);
                setCell(ws, `C${r}`, "", S.totalLbl);
                setCell(ws, `D${r}`, "", S.totalLbl);
                setCell(ws, `E${r}`, "", S.totalNum);
            }

            if (rc) {
                setCell(ws, `G${r}`, `Total ${rc.name}`, S.totalLbl);
                setCell(ws, `H${r}`, "", S.totalLbl);
                setCell(ws, `I${r}`, "", S.totalLbl);
                setCell(ws, `J${r}`, 0, S.totalNum, revEnd >= revStart ? `SUM(J${revStart}:J${revEnd})` : "0");
                addMerge(ws, `G${r}`, `I${r}`);
                revTotals.push(`J${r}`);
            } else {
                setCell(ws, `G${r}`, "", S.totalLbl);
                setCell(ws, `H${r}`, "", S.totalLbl);
                setCell(ws, `I${r}`, "", S.totalLbl);
                setCell(ws, `J${r}`, "", S.totalNum);
            }
            r++;

            // spacer row
            setCell(ws, `B${r}`, "", S.text(false));
            setCell(ws, `C${r}`, "", S.int(false));
            setCell(ws, `D${r}`, "", S.num(false));
            setCell(ws, `E${r}`, "", S.num(false));

            setCell(ws, `G${r}`, "", S.text(false));
            setCell(ws, `H${r}`, "", S.int(false));
            setCell(ws, `I${r}`, "", S.num(false));
            setCell(ws, `J${r}`, "", S.num(false));
            r++;
        }

        // Grand totals
        const totalDepRow = r;
        setCell(ws, `B${totalDepRow}`, "Total Dépenses", S.totalLbl);
        setCell(ws, `C${totalDepRow}`, "", S.totalLbl);
        setCell(ws, `D${totalDepRow}`, "", S.totalLbl);
        setCell(ws, `E${totalDepRow}`, 0, S.totalNum, expTotals.length ? `SUM(${expTotals.join(",")})` : "0");
        addMerge(ws, `B${totalDepRow}`, `D${totalDepRow}`);

        setCell(ws, `G${totalDepRow}`, "Total Recettes", S.totalLbl);
        setCell(ws, `H${totalDepRow}`, "", S.totalLbl);
        setCell(ws, `I${totalDepRow}`, "", S.totalLbl);
        setCell(ws, `J${totalDepRow}`, 0, S.totalNum, revTotals.length ? `SUM(${revTotals.join(",")})` : "0");
        addMerge(ws, `G${totalDepRow}`, `I${totalDepRow}`);
        r++;

        // Frais (editable)
        const fraisRow = r;
        setCell(ws, `B${fraisRow}`, "Frais de fonctionnement", S.text(true));
        setCell(ws, `C${fraisRow}`, "", S.int(true));
        setCell(ws, `D${fraisRow}`, "", S.num(true));
        setCell(ws, `E${fraisRow}`, 0, S.num(true));
        addMerge(ws, `B${fraisRow}`, `D${fraisRow}`);

        setCell(ws, `G${fraisRow}`, "", S.text(true));
        setCell(ws, `H${fraisRow}`, "", S.int(true));
        setCell(ws, `I${fraisRow}`, "", S.num(true));
        setCell(ws, `J${fraisRow}`, "", S.num(true));
        r++;

        // Résultat
        const resRow = r;
        setCell(ws, `B${resRow}`, "Résultat", S.totalLbl);
        setCell(ws, `C${resRow}`, "", S.totalLbl);
        setCell(ws, `D${resRow}`, "", S.totalLbl);
        setCell(ws, `E${resRow}`, 0, S.totalNum, `J${totalDepRow}-E${totalDepRow}-E${fraisRow}`);
        addMerge(ws, `B${resRow}`, `D${resRow}`);

        setCell(ws, `G${resRow}`, "", S.totalLbl);
        setCell(ws, `H${resRow}`, "", S.totalLbl);
        setCell(ws, `I${resRow}`, "", S.totalLbl);
        setCell(ws, `J${resRow}`, "", S.totalNum);
        r++;

        const lastRow = Math.max(resRow + 2, 12);
        ws["!ref"] = `A1:J${lastRow}`;
        return ws;
    }

    ns.downloadExcel = function downloadExcel(state) {
        const wb = XLSX.utils.book_new();
        const ws = buildSheet(state);
        XLSX.utils.book_append_sheet(wb, ws, "Budget");

        const safe = (state.meta.title || "Budget").replace(/[\\/:*?"<>|]+/g, "-");
        XLSX.writeFile(wb, `${safe}.xlsx`, { bookType: "xlsx" });
    };
})(window.BudgetApp);
