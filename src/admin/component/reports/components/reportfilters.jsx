export const PROGRAMS = ["BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim", "STEM", "ABM", "HUMSS", "GAS", "HE", "ICT"];
export const PROGRAM_OPTIONS = [{ value: "", label: "All Programs" }, ...PROGRAMS.map(value => ({ value, label: value }))];
export function FilterSelect({ label, value, onChange, options }) {
    return <label className="report-filter">{label &&
            <span>{label}
            </span>}
    <select value={value} onChange={onChange}>{options.map(option => <option key={option.value} value={option.value}>{option.label}
  </option>)}
    </select>
    </label>;
}
export function DateFilters({ filters, updateFilter }) {
    return <div className="reports-date-grid">
    <label className="report-filter">
  <span>Date From
  </span>
  <input type="date" value={filters.startDate} max={filters.endDate || undefined} onChange={e => updateFilter("startDate", e.target.value)}/>
    </label>
    <label className="report-filter">
  <span>Date To
  </span>
  <input type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={e => updateFilter("endDate", e.target.value)}/>
    </label>
    </div>;
}
export default function ReportFilters({ filters, updateFilter, placeholder = "Search Research Title", dates = true }) {
    return <>
    <input className="reports-search" type="text" placeholder={placeholder} value={filters.search} onChange={e => updateFilter("search", e.target.value)}/>
    <FilterSelect value={filters.program} onChange={e => updateFilter("program", e.target.value)} options={PROGRAM_OPTIONS}/>{dates &&
            <DateFilters filters={filters} updateFilter={updateFilter}/>}
  </>;
}
