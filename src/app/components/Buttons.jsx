window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.Btn = {};

    ns.Btn.PillAction = function PillAction({ tone, children, onClick, disabled }) {
        const bg = tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]";
        const dis = disabled ? "opacity-50 pointer-events-none" : "";
        return (
            <button
                type="button"
                className={`inline-flex items-center gap-3 h-10 px-6 pill text-white text-sm font-extrabold ${bg} hover:brightness-95 active:scale-[.99] ${dis}`}
                onClick={onClick}
            >
                <span className="text-[18px] leading-none">+</span>
                <span>{children}</span>
            </button>
        );
    };

    ns.Btn.Download = function DownloadBtn({ icon, children, onClick }) {
        return (
            <button
                type="button"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[12px] bg-black text-white text-sm font-semibold hover:brightness-95 active:scale-[.99]"
                onClick={onClick}
            >
                <i className={icon}></i>
                {children}
            </button>
        );
    };

    ns.Btn.LinkTag = function LinkTag({ tone, url, disabled }) {
        if (!url) return null;

        const label = ns.siteLabel(url) || url;
        const href = ns.normalizeUrl(url);

        const bg = tone === "green" ? "bg-[var(--green)]" : "bg-[var(--red)]";
        const base = "inline-flex items-center gap-2 h-7 px-3 pill text-xs font-extrabold";
        const active = `${bg} text-white hover:brightness-95`;
        const disabledStyle = "bg-black/10 text-black/35";

        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={`${base} ${disabled ? disabledStyle : active}`}
                onClick={(e) => disabled && e.preventDefault()}
                title={href}
            >
                <i className="bi bi-link-45deg"></i>
                {label}
            </a>
        );
    };
})(window.BudgetApp);
