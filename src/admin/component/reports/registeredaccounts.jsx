import { useMemo } from "react";
import ReportTable from "./components/reporttables";
export default function RegisteredAccounts({ records, filters, updateFilter, loading, error }) {
    const data = useMemo(() => records.filter(a => [a.f_name, a.l_name, a.course, a.id, a.year, a.section, a.email].map(v => String(v ?? "")).join(" ").toLowerCase().includes(filters.search.trim().toLowerCase())), [records, filters.search]);
    return <>
    <input className="reports-search" type="text" placeholder="Search name, ID, course, section, or email..." value={filters.search} onChange={e => updateFilter("search", e.target.value)}/>
    <div className="reports-section-divider"/>
    <h2 className="reports-most-viewed-title">Registered Accounts ({data.length})
    </h2>
        {!loading && !error &&
            <ReportTable headers={["ID", "First Name", "Last Name", "Year", "Course", "Section", "Email"]} rows={data.map(a => ({ key: a.id, cells: [a.id, a.f_name, a.l_name, a.year, a.course, a.section, a.email].map(v => v ?? "—") }))} emptyMessage="No registered accounts found."/>}
    </>;
}
