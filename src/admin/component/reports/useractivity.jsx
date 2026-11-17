import { useMemo } from "react";
import { FilterSelect, DateFilters } from "./components/reportfilters";
import ReportTable from "./components/reporttables";

const TYPE_OPTIONS = [{ 
    value: "", 
    label: "All User Types" 
    }, { 
    value: "student", 
    label: "Student" 
    }, { 
    value: "admin", 
    label: "Admin" 
    }];

const ACTIVITY_OPTIONS = [{ 
    value: "", 
    label: "All Activities" 
    }, ...([
    "Login", 
    "View Research", 
    "Upload Research", 
    "Logout"].map(value => ({ value, label: value })))];
    
export default function UserActivity({ 
    records, 
    filters, 
    updateFilter, 
    loading, 
    error 
    }) {

    const data = useMemo(() => records.filter(r => { 
        const type = !filters.userType || String(r.userType || "").toLowerCase() === filters.userType.toLowerCase(); 
    const activity = !filters.activity || r.activity === filters.activity; 
    const search = `${r.user || ""} ${r.activity || ""}`.toLowerCase().includes(filters.search.trim().toLowerCase()); 
    const date = r.createdAt ? new Date(r.createdAt) : null; 
    const valid = date && !Number.isNaN(date.getTime()); return type && activity && search && 
    (!filters.startDate || (valid && date >= new Date(`${filters.startDate}T00:00:00`))) && (!filters.endDate || 
        (valid && date <= new Date(`${filters.endDate}T23:59:59`))); }), [records, filters]);

    return <>
    <h2>Report Filters
    </h2>
    <div className="reports-filter-grid">
  <FilterSelect label="User Type" value={filters.userType} onChange={e => updateFilter("userType", e.target.value)} options={TYPE_OPTIONS}/>
  <FilterSelect label="Activity" value={filters.activity} onChange={e => updateFilter("activity", e.target.value)} options={ACTIVITY_OPTIONS}/>
    </div>
    <input className="reports-search" type="text" placeholder="Search user email or activity..." value={filters.search} onChange={e => updateFilter("search", e.target.value)}/>
    <DateFilters filters={filters} updateFilter={updateFilter}/>{!loading && !error &&
            <ReportTable headers={["User", "User Type", "Activity", "Date & Time"]} 
            rows={data.map(r => ({ key: r.id, cells: [r.user, r.userType, r.activity, r.createdAt ? new Date(r.createdAt).toLocaleString() : "Unknown"] }))} 
            emptyMessage="No user activity records found."/>}
  </>;
}
