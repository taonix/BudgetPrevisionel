window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    // =========================
    // Helpers (ceux utilisés partout)
    // =========================
    ns.uid =
        ns.uid ||
        function uid() {
            return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 7);
        };

    ns.clampInt =
        ns.clampInt ||
        function clampInt(v, min) {
            const n = parseInt(v, 10);
            if (Number.isNaN(n)) return min;
            return Math.max(min, n);
        };

    ns.clampFloat =
        ns.clampFloat ||
        function clampFloat(v, min) {
            const n = parseFloat(v);
            if (Number.isNaN(n)) return min;
            return Math.max(min, n);
        };

    ns.normalizeUrl =
        ns.normalizeUrl ||
        function normalizeUrl(url) {
            if (!url) return "";
            const u = String(url).trim();
            if (!u) return "";
            if (/^https?:\/\//i.test(u)) return u;
            return "https://" + u;
        };

    ns.siteLabel =
        ns.siteLabel ||
        function siteLabel(url) {
            try {
                const u = new URL(ns.normalizeUrl(url));
                let host = u.hostname.replace(/^www\./, "");
                const base = host.split(".")[0] || host;
                if (!base) return host || "Lien";
                return base.charAt(0).toUpperCase() + base.slice(1);
            } catch {
                return "Lien";
            }
        };

    ns.euro =
        ns.euro ||
        function euro(n) {
            const v = Number(n || 0);
            return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
        };

    // ✅ Re-ajout des fonctions manquantes qui cassent App.jsx
    ns.sumCategory =
        ns.sumCategory ||
        function sumCategory(cat) {
            const items = cat?.items || [];
            let total = 0;
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                if (it?.hidden) continue;
                const qty = Number(it?.qty ?? 1) || 0;
                const price = Number(it?.price ?? 0) || 0;
                total += qty * price;
            }
            return total;
        };

    ns.sumSection =
        ns.sumSection ||
        function sumSection(section) {
            const cats = section?.categories || [];
            let total = 0;
            for (let i = 0; i < cats.length; i++) total += ns.sumCategory(cats[i]);
            return total;
        };

    // =========================
    // URL courte : pack + deflate + base64url (hash)
    // =========================
    function bytesToBase64(bytes) {
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
    }
    function base64ToBytes(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    ns.b64urlFromBytes = function b64urlFromBytes(bytes) {
        return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    };
    ns.bytesFromB64url = function bytesFromB64url(b64url) {
        const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
        return base64ToBytes(b64);
    };

    // Pack compact (clés courtes + arrays)
    ns.packState = function packState(s) {
        const packItems = (items) =>
            (items || []).map((it) => [
                it?.id || "",
                it?.name || "",
                it?.qty ?? 1,
                it?.price ?? 0,
                it?.link || "",
                it?.hidden ? 1 : 0,
            ]);

        const packCats = (cats) => (cats || []).map((c) => [c?.id || "", c?.name || "", c?.open ? 1 : 0, packItems(c?.items)]);

        const m = s?.meta || {};
        return {
            m: {
                t: m.title || "Budget prévisionnel",
                x: m.excelColor || "#6AA84F",
                er: Number.isFinite(m.excelExtraRows) ? m.excelExtraRows : 0,
            },
            e: { c: packCats(s?.expenses?.categories) },
            r: { c: packCats(s?.revenues?.categories) },
        };
    };

    ns.unpackState = function unpackState(p) {
        if (!p || !p.e || !p.r) return null;

        const unpackItems = (arr) =>
            (arr || []).map((it) => ({
                id: it?.[0] || ns.uid(),
                name: it?.[1] || "",
                qty: Number(it?.[2] ?? 1),
                price: Number(it?.[3] ?? 0),
                link: it?.[4] || "",
                hidden: !!it?.[5],
            }));

        const unpackCats = (arr) =>
            (arr || []).map((c) => ({
                id: c?.[0] || ns.uid(),
                name: c?.[1] || "",
                open: !!c?.[2],
                items: unpackItems(c?.[3]),
            }));

        const m = p.m || {};
        return {
            meta: {
                title: m.t || "Budget prévisionnel",
                excelColor: m.x || "#6AA84F",
                excelExtraRows: Number.isFinite(m.er) ? m.er : 0,
            },
            expenses: { categories: unpackCats(p.e.c) },
            revenues: { categories: unpackCats(p.r.c) },
        };
    };

    async function deflateString(str) {
        const bytes = new TextEncoder().encode(str);
        if (!("CompressionStream" in window)) return null;
        const cs = new CompressionStream("deflate");
        const ab = await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer();
        return new Uint8Array(ab);
    }

    async function inflateBytes(bytes) {
        if (!("DecompressionStream" in window)) return null;
        const ds = new DecompressionStream("deflate");
        const ab = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
        return new TextDecoder().decode(new Uint8Array(ab));
    }

    // Hash format: #d=<b64url(deflate(JSON(pack)))>
    ns.encodeShareHash = async function encodeShareHash(state) {
        const packed = ns.packState(state);
        const json = JSON.stringify(packed);
        const compressed = await deflateString(json);

        const payload = compressed
            ? ns.b64urlFromBytes(compressed)
            : ns.b64urlFromBytes(new TextEncoder().encode(json));

        return `#d=${payload}`;
    };

    ns.decodeShareHash = async function decodeShareHash(hashStr) {
        try {
            const h = (hashStr || window.location.hash || "").replace(/^#/, "");
            const m = /^d=([A-Za-z0-9\-_]+)$/.exec(h);
            if (!m) return null;

            const bytes = ns.bytesFromB64url(m[1]);
            let json = await inflateBytes(bytes);
            if (!json) json = new TextDecoder().decode(bytes);

            return ns.unpackState(JSON.parse(json));
        } catch {
            return null;
        }
    };
})(window.BudgetApp);
