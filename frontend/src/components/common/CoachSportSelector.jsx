
export default function CoachSportSelector({
  sports = [],
  selectedIds = [],
  onChange,
  loading = false,
  label = 'Bộ môn giảng dạy *',
}) {
  const toggleSport = (id) => {
    const key = String(id);
    if (selectedIds.includes(key)) {
      onChange(selectedIds.filter((item) => item !== key));
    } else {
      onChange([...selectedIds, key]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          Đã chọn {selectedIds.length} bộ môn
        </span>
      </div>
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          Đang tải danh sách bộ môn...
        </div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          Chưa tải được danh sách bộ môn từ hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
          {sports.map((sport) => {
            const key = String(sport.sportId);
            const checked = selectedIds.includes(key);
            const sportLabel = sport.sportName || sport.name;
            return (
              <label
                key={key}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors select-none ${
                  checked
                    ? 'border-orange-400 bg-orange-50 text-orange-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSport(key)}
                  className="h-3.5 w-3.5 rounded accent-orange-500 cursor-pointer"
                />
                <span className="truncate">{sportLabel}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
