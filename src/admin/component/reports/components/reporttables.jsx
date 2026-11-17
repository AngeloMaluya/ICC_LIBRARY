export default function ReportTable({ headers, rows, emptyMessage = "No records found." }) {
    return <div className="reports-table-container">
    <table className="reports-table">
  <thead>
    <tr>{headers.map(h => <th key={h}>{h}
      </th>)}
    </tr>
  </thead>
  <tbody>{rows.length ? rows.map((row, index) => <tr key={row.key ?? index}>{row.cells.map((cell, i) => <td key={i}>{cell ?? "—"}
      </td>)}
    </tr>) :
            <tr>
      <td colSpan={headers.length} className="reports-table-empty">{emptyMessage}
      </td>
    </tr>}
  </tbody>
    </table>
    </div>;
}
