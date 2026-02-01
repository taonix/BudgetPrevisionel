window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.downloadPDF = function downloadPDF(state) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

        const title = state.meta.title || "Budget prévisionnel";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(title, 40, 46);

        const buildRows = (section, isExpense) => {
            const rows = [];
            section.categories.forEach((c) => {
                rows.push([{ content: c.name, colSpan: 3, styles: { fontStyle: "bold", fillColor: isExpense ? [251, 233, 233] : [234, 244, 227] } }]);
                c.items.filter((i) => !i.hidden).forEach((i) => {
                    rows.push([`x${i.qty}  ${i.name}`, i.link ? i.link : "", ns.euro((i.qty || 0) * (i.price || 0))]);
                });
                rows.push([
                    { content: `Total ${c.name}`, styles: { fontStyle: "bold", fillColor: isExpense ? [255, 242, 242] : [244, 251, 233] } },
                    { content: "", styles: { fillColor: isExpense ? [255, 242, 242] : [244, 251, 233] } },
                    { content: ns.euro(ns.sumCategory(c)), styles: { fontStyle: "bold", fillColor: isExpense ? [255, 242, 242] : [244, 251, 233], halign: "right" } },
                ]);
                rows.push(["", "", ""]);
            });
            return rows;
        };

        const expRows = buildRows(state.expenses, true);
        const revRows = buildRows(state.revenues, false);

        const head = [["Dépenses", "", "", "Recettes", "", ""]];
        const body = [];
        const max = Math.max(expRows.length, revRows.length);
        for (let i = 0; i < max; i++) {
            const e = expRows[i] || ["", "", ""];
            const r = revRows[i] || ["", "", ""];
            body.push([e[0], e[1], e[2], r[0], r[1], r[2]]);
        }

        doc.autoTable({
            startY: 70,
            head,
            body,
            theme: "grid",
            styles: { font: "helvetica", fontSize: 10, cellPadding: 6, valign: "middle" },
            headStyles: { fillColor: [61, 126, 43], textColor: 255, fontStyle: "bold", halign: "center" },
            columnStyles: {
                0: { cellWidth: 240 },
                1: { cellWidth: 140 },
                2: { cellWidth: 90, halign: "right" },
                3: { cellWidth: 240 },
                4: { cellWidth: 140 },
                5: { cellWidth: 90, halign: "right" },
            },
        });

        const expTotal = ns.sumSection(state.expenses);
        const revTotal = ns.sumSection(state.revenues);
        const res = revTotal - expTotal;

        const y = doc.lastAutoTable.finalY + 22;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Dépenses : ${ns.euro(expTotal)}`, 40, y);
        doc.text(`Total Recettes : ${ns.euro(revTotal)}`, 320, y);
        doc.text(`Résultat : ${res >= 0 ? "+" : "-"}${ns.euro(Math.abs(res))}`, 600, y);

        const safe = (title || "Budget").replace(/[\\/:*?"<>|]+/g, "-");
        doc.save(`${safe}.pdf`);
    };
})(window.BudgetApp);
