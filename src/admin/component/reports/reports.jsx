import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiEye, FiPrinter, FiUsers } from "react-icons/fi";
import { LuSwatchBook } from "react-icons/lu";
import { FaQuoteLeft } from "react-icons/fa";

import ExcelJS from "exceljs";

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

const buildThemeExcel = (workbook, groupedThemes) => {
  const worksheet = workbook.addWorksheet("Research Themes");

  worksheet.columns = [
    { width: 10 },
    { width: 70 },
    { width: 35 },
    { width: 18 },
    { width: 12 },
    { width: 25 },
  ];

  // MAIN TITLE
  worksheet.mergeCells("A1:F1");

  const titleCell = worksheet.getCell("A1");

  titleCell.value = "ICC DIGITAL LIBRARY - RESEARCH THEMES";
  titleCell.font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0D4B8E" },
  };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(1).height = 35;

  worksheet.getCell("A3").value =
    `Generated: ${new Date().toLocaleString()}`;

  let rowNumber = 5;

  groupedThemes.forEach(({ theme, researches }, themeIndex) => {
    // THEME HEADER
    worksheet.mergeCells(rowNumber, 1, rowNumber, 6);

    const themeCell = worksheet.getCell(rowNumber, 1);

    themeCell.value =
      `THEME ${themeIndex + 1}: ${theme} (${researches.length} papers)`;

    themeCell.font = {
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };

    themeCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF104578" },
    };

    worksheet.getRow(rowNumber).height = 28;
    rowNumber++;

    // TABLE HEADERS
    const headers = [
      "No.",
      "Research Title",
      "Author",
      "Program",
      "Year",
      "Accession Number",
    ];

    const headerRow = worksheet.getRow(rowNumber);

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);

      cell.value = header;
      cell.font = {
        bold: true,
        color: { argb: "FF000000" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCE6F1" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    headerRow.height = 25;
    rowNumber++;

    // RESEARCH PAPERS
    researches.forEach((research, researchIndex) => {
      const row = worksheet.getRow(rowNumber);

      row.values = [
        researchIndex + 1,
        research.title || "Untitled",
        research.author || "Unknown",
        research.program || "N/A",
        research.year || "N/A",
        research.accession_number || "N/A",
      ];

      row.alignment = {
        vertical: "middle",
        wrapText: true,
      };

      row.height = 35;

      if (researchIndex % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        });
      }

      rowNumber++;
    });

    // SPACE BETWEEN THEMES
    rowNumber += 2;
  });

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 3,
    },
  ];

  return worksheet;
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
    
    const [allThemeRecords, setAllThemeRecords] = useState([]);

    const [exporting, setExporting] = useState(false);
    
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
                    setAllThemeRecords(data.allThemes || []);
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

            const printReport = async () => {
            if (!activeReport || loading || error || exporting) return;

            setExporting(true);

            try {

            let records = [];
            let reportTitle = "";

            switch (activeReport) {
            case "viewing": {
            // Apply the same filters as researchviews.jsx
            const filteredRecords = viewingRecords.filter((r) => {
                if (Number(r.views || 0) <= 0) return false;

                const program =
                !filters.program ||
                String(r.program || "").toLowerCase() ===
                    filters.program.toLowerCase();

                const search = String(r.title || "")
                .toLowerCase()
                .includes(filters.search.trim().toLowerCase());

                const date = r.lastViewedAt
                ? new Date(r.lastViewedAt)
                : null;

                const valid = date && !Number.isNaN(date.getTime());

                return (
                program &&
                search &&
                (!filters.startDate ||
                    (valid &&
                    date >= new Date(`${filters.startDate}T00:00:00`))) &&
                (!filters.endDate ||
                    (valid &&
                    date <= new Date(`${filters.endDate}T23:59:59`)))
                );
            });

            // Same 25% threshold as ResearchViews
            const highestViewCount = Math.max(
                0,
                ...filteredRecords.map((r) => Number(r.views) || 0)
            );

            const minimumViewCount = Math.max(
                1,
                Math.ceil(highestViewCount * 0.25)
            );

            records = filteredRecords
                .filter((r) => Number(r.views || 0) >= minimumViewCount)
                .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
                .map((r) => ({
                "Research Title": r.title,
                Program: r.program,
                Views: Number(r.views) || 0,
                "Last Viewed": r.lastViewedAt || "",
                }));

            reportTitle = "Research Views";
            break;
            }
            case "collection": {
            if (!themeRecords.length) {
                alert("No research themes available to export.");
                return;
            }

            const token = sessionStorage.getItem("authToken");

            if (!token) {
                throw new Error("Admin session not found.");
            }

            const baseURL = API_URL.replace(/\/+$/, "");

            // Sort themes by research count
            const sortedThemes = [...allThemeRecords].sort(
                (a, b) =>
                Number(b.researchCount || 0) -
                Number(a.researchCount || 0)
            );

            // Fetch research papers for every theme
            const groupedThemes = await Promise.all(
                sortedThemes.map(async (themeRecord) => {
                const themeName = themeRecord.theme;

                const url =
                    `${baseURL}/api/reports/themes/researches` +
                    `?theme=${encodeURIComponent(themeName)}`;

                const response = await fetch(url, {
                    headers: {
                    Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(
                    `Failed to load research papers for ${themeName}`
                    );
                }

                const data = await response.json();

                return {
                    theme: themeName,
                    researches: data.records || [],
                };
                })
            );

            // CREATE EXCEL WORKBOOK
            const workbook = new ExcelJS.Workbook();

            buildThemeExcel(workbook, groupedThemes);

            const buffer = await workbook.xlsx.writeBuffer();

            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download =
                `ICC_Research_Themes_${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            return;
            }

            case "citations":
                records = citationRecords;
                reportTitle = "Citation Counts";
                break;

            case "accounts":
                records = accountRecords;
                reportTitle = "Registered Accounts";
                break;

            case "activity":
                records = activityRecords;
                reportTitle = "User Activity";
                break;

            default:
                return;
            }

            if (!records.length) {
            alert("No records available to export.");
            return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(reportTitle);

            // Determine column names from the first record
            const columns = Object.keys(records[0]);

            // Report title
            worksheet.mergeCells(1, 1, 1, columns.length);

            const titleCell = worksheet.getCell("A1");
            titleCell.value = `ICC DIGITAL LIBRARY - ${reportTitle.toUpperCase()}`;
            titleCell.font = {
            bold: true,
            size: 16,
            color: { argb: "FFFFFFFF" },
            };

            titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0D4B8E" },
            };

            titleCell.alignment = {
            vertical: "middle",
            horizontal: "center",
            };

            worksheet.getRow(1).height = 35;

            // Export date
            worksheet.getCell("A3").value =
            `Generated: ${new Date().toLocaleString()}`;

            // Column headers
            const headerRow = worksheet.getRow(5);

            columns.forEach((column, index) => {
            const cell = headerRow.getCell(index + 1);

            cell.value = column
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());

            cell.font = {
                bold: true,
                color: { argb: "FFFFFFFF" },
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF104578" },
            };

            cell.alignment = {
                vertical: "middle",
                horizontal: "center",
            };
            });

            headerRow.height = 25;

            // Add report records
            records.forEach((record, rowIndex) => {
            const row = worksheet.getRow(rowIndex + 6);

            columns.forEach((column, columnIndex) => {
                const value = record[column];

                row.getCell(columnIndex + 1).value =
                value === null || value === undefined
                    ? ""
                    : typeof value === "object"
                    ? JSON.stringify(value)
                    : value;
            });

            if (rowIndex % 2 === 0) {
                row.eachCell((cell) => {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF1F5F9" },
                };
                });
            }
            });

            // Set column widths
            columns.forEach((column, index) => {
            worksheet.getColumn(index + 1).width = Math.min(
                Math.max(column.length + 8, 18),
                50
            );
            });

            // Enable Excel filters
            worksheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: columns.length },
            };

            // Freeze title and header rows
            worksheet.views = [
            {
                state: "frozen",
                ySplit: 5,
            },
            ];

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();

            const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `ICC_${activeReport}_Report_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            } catch (err) {
                console.error("Excel export error:", err);
                alert("Failed to export Excel report.");
            } finally {
                setExporting(false);
            }
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
            {activeReport && (
            <button
                type="button"
                className="reports-print-button"
                onClick={printReport}
                disabled={loading || exporting || Boolean(error)}
                title="Export report to Excel"
            >
                <FiPrinter />
                {exporting ? " Exporting..." : " Print Report"}
            </button>
            )}
        </main>
      </div>;
}
