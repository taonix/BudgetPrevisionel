window.BudgetApp = window.BudgetApp || {};
(function (ns) {
    ns.Field = {};

    ns.Field.Text = function TextField({
                                           label,
                                           value,
                                           onChange,
                                           placeholder,
                                           rightHint,
                                           required,
                                           type = "text",
                                       }) {
        return (
            <label className="block">
                <div className="flex items-end justify-between gap-3">
                    <div className="text-sm font-medium text-black/70">
                        {label}
                        {required ? <span className="text-red-600"> *</span> : null}
                    </div>
                    {rightHint ? <div className="text-xs text-black/40">{rightHint}</div> : null}
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    className="mt-2 w-full h-11 rounded-[14px] border border-black/15 px-4 outline-none focus:ring-2 focus:ring-black/10"
                />
            </label>
        );
    };
})(window.BudgetApp);
