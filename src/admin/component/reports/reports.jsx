import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiEye, FiPrinter, FiUsers } from "react-icons/fi";
import { LuSwatchBook } from "react-icons/lu";
import { FaQuoteLeft } from "react-icons/fa";

import ResearchViews from "./researchviews";
import ResearchThemes from "./researchthemes";
import CitationCounts from "./citationcounts";
import RegisteredAccounts from "./registeredaccounts";
import UserActivity from "./useractivity";
import "./reports.css";


const REPORT_TYPES = [{ 
    id: "viewing", 
    title: "Research Views",
    description: "Number of times each research document has been opened.", 
    icon: FiEye 
    },{ 
    id: "collection", 
    title: "Popular Research Themes", 
    description: "AI identifies and categorizes research into common topics.", 
    icon: LuSwatchBook 
    },{
    id: "citations", 
    title: "Citation Counts", 
    description: "Number of times students used the Cite feature for research documents.", 
    icon: FaQuoteLeft 
    }, {
    id: "accounts",
    title: "Registered Accounts",
    description: "View registered students and their account information.", 
    icon: FiUsers 
    }];
    
const INITIAL_FILTERS = { 
    program: "", 
    userType: "", 
    activity: "", 
    search: "", 
    startDate: "", 
    endDate: "" 
    };

export default function Reports() {
    const API_URL = import.meta.env.VITE_API_URL;
 
    const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
    const [viewingRecords, setViewingRecords] = useState([]);
    const [themeRecords, setThemeRecords] = useState([]);
    const [themeStats, setThemeStats] = useState(null);
    const [citationRecords, setCitationRecords] = useState([]);
    const [accountRecords, setAccountRecords] = useState([]);
    const [activityRecords, setActivityRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [searchParams, setSearchParams] = useSearchParams();

    const validReports = [
      "viewing",
      "collection",
      "citations",
      "accounts",
      "activity",
    ];
    
    const report = searchParams.get("report");
    
    const activeReport = validReports.includes(report)
      ? report
      : null;
    

    useEffect(() => { document.title = "Admin Reports"; }, []);
    const updateFilter = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
    
    const openReport = (id) => {
      setFilters({ ...INITIAL_FILTERS });
      setError("");
      setSearchParams({ report: id });
    };
    
    const selectedReport = REPORT_TYPES.find(r => r.id === activeReport);
    useEffect(() => {
        if (!activeReport)
            return;
        const controller = new AbortController();
        const fetchReport = async () => {
            setLoading(true);
            setError("");
            try {
                const token = sessionStorage.getItem("authToken");
                if (!token)
                    throw new Error("Please log in as an administrator.");
                if (!API_URL)
                    throw new Error("Backend URL is not configured.");
                const endpoint = { 
                    viewing: "viewing", 
                    collection: "themes", 
                    citations: "citations", 
                    activity: "activity", 
                    accounts: "accounts" }[activeReport];

                const params = new URLSearchParams();
                if (activeReport === "collection") {
                    if (filters.search.trim())
                        params.set("search", filters.search.trim());
                    if (filters.program)
                        params.set("program", filters.program);
                    if (filters.startDate)
                        params.set("startDate", filters.startDate);
                    if (filters.endDate)
                        params.set("endDate", filters.endDate);
                }
                if (activeReport === "citations") {
                    if (filters.startDate)
                        params.set("startDate", filters.startDate);
                    if (filters.endDate)
                        params.set("endDate", filters.endDate);
                }
                const query = params.toString();
                const baseURL = API_URL.replace(/\/+$/, "");
                const url = activeReport === "accounts" ? `${baseURL}/api/accounts` : `${baseURL}/api/reports/${endpoint}${query ? `?${query}` : ""}`;
                const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.includes("application/json"))
                    throw new Error(`The server returned HTML instead of JSON. Check the backend URL and /api/reports/${endpoint} route. (HTTP ${response.status})`);
                const data = await response.json();
                if (!response.ok)
                    throw new Error(data.message || "Failed to load report.");
                if (controller.signal.aborted)
                    return;
                if (activeReport === "viewing")
                    setViewingRecords(data.records || []);
                if (activeReport === "collection") {
                    setThemeRecords(data.records || []);
                    setThemeStats(data);
                }
                if (activeReport === "citations")
                    setCitationRecords(data.records || []);
                if (activeReport === "activity")
                    setActivityRecords(data.records || []);
                if (activeReport === "accounts")
                    setAccountRecords(data.records || []);
            }
            catch (err) {
                if (err.name === "AbortError" || controller.signal.aborted)
                    return;
                setError(err.message || "Unable to load report.");
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        };
        const timer = setTimeout(fetchReport, activeReport === "collection" ? 350 : 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [activeReport, API_URL, activeReport === "collection" ? filters.search : 
        null, activeReport === "collection" ? filters.program : null, 
        ["collection", "citations"].includes(activeReport) ? filters.startDate : null, 
        ["collection", "citations"].includes(activeReport) ? filters.endDate : null]);

    const shared = { filters, updateFilter, loading, error };
    const printReport = () => {
        if (activeReport && !loading && !error)
            window.print();
    };
    return <div className="admin-reports-layout">
    <main className="reports-main">{!activeReport ?
            <>
    <header className="reports-page-header">
      <h1>Reports
      </h1>
      <p>Generate and manage library research repository reports.
      </p>
    </header>
    <section className="reports-selection">
      <h2>Select Report
      </h2>
      <div className="reports-selection-list">{REPORT_TYPES.map(report => {
                    const Icon = report.icon;
                    return <button type="button" key={report.id} className="reports-option" onClick={() => openReport(report.id)}>
        <Icon className="reports-option-icon"/>
        <span className="reports-option-text">
          <strong>{report.title}
          </strong>
          <small>{report.description}
          </small>
        </span>
        <FiChevronLeft className="reports-option-arrow"/>
      </button>;
                })}
    </div>
  </section>
            </> :
            <>
  <header className="reports-page-header reports-detail-header">
   <button
  type="button"
  className="reports-back-button"
  onClick={() => setSearchParams({})}
  aria-label="Back to reports"
>
  <FiChevronLeft />
</button>
    <div>
      <h1>{selectedReport?.title || (activeReport === "activity" ? "User Activity" : "Reports")}
      </h1>
      <p>{selectedReport?.description}
      </p>
    </div>
  </header>
  <section className="reports-detail">{activeReport === "accounts" &&
                    <RegisteredAccounts records={accountRecords} {...shared}/>}{loading &&
                    <p className="reports-status">Loading report data...
      </p>}{error &&
                    <p className="reports-status reports-error" role="alert">{error}
      </p>}{activeReport === "viewing" &&
                    <ResearchViews records={viewingRecords} {...shared}/>}{activeReport === "collection" &&
                    <ResearchThemes records={themeRecords} stats={themeStats} {...shared}/>}{activeReport === "citations" &&
                    <CitationCounts records={citationRecords} {...shared}/>}{activeReport === "activity" &&
                    <UserActivity records={activityRecords} {...shared}/>}
            </section>
          </>}
          <button type="button" className="reports-print-button" onClick={printReport} 
          disabled={!activeReport || loading || Boolean(error)} title={!activeReport ? "Select a report to print" : "Print this report"}>
            <FiPrinter /> Print Report
          </button>
        </main>
      </div>;
}
