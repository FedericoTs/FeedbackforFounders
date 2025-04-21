/**
 * Utility functions for exporting data in various formats
 */

/**
 * Convert an array of objects to CSV format
 */
export function objectsToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const csvRows = [headers.join(",")];

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      // Handle null, undefined, and objects
      if (val === null || val === undefined) return "";
      if (typeof val === "object")
        return JSON.stringify(val).replace(/"/g, '""');
      // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
      if (
        typeof val === "string" &&
        (val.includes(",") || val.includes('"') || val.includes("\n"))
      ) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Download data as a CSV file
 */
export function downloadCSV(data: any[], filename: string): void {
  const csv = objectsToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download data as a JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format feedback data for export
 */
export function formatFeedbackForExport(feedbackItems: any[]): any[] {
  return feedbackItems.map((item) => ({
    id: item.id,
    project_id: item.project_id,
    element_selector: item.element_selector,
    content: item.content,
    category: item.category,
    subcategory: item.subcategory || "",
    severity: item.severity,
    sentiment: item.sentiment || 0,
    implementation_status: item.implementation_status,
    created_at: item.created_at,
    user_name: item.user?.full_name || "Anonymous",
    user_email: item.user?.email || "",
  }));
}

/**
 * Format feedback with responses for export
 */
export function formatFeedbackWithResponsesForExport(
  feedbackItems: any[],
): any[] {
  const result: any[] = [];

  feedbackItems.forEach((item) => {
    // Add the main feedback item
    result.push({
      id: item.id,
      project_id: item.project_id,
      element_selector: item.element_selector,
      content: item.content,
      category: item.category,
      subcategory: item.subcategory || "",
      severity: item.severity,
      sentiment: item.sentiment || 0,
      implementation_status: item.implementation_status,
      created_at: item.created_at,
      user_name: item.user?.full_name || "Anonymous",
      user_email: item.user?.email || "",
      is_response: false,
    });

    // Add responses if any
    if (item.responses && item.responses.length > 0) {
      item.responses.forEach((response: any) => {
        result.push({
          id: response.id,
          feedback_id: item.id,
          content: response.content,
          is_official: response.is_official,
          created_at: response.created_at,
          user_name: response.user?.full_name || "Anonymous",
          is_response: true,
        });
      });
    }
  });

  return result;
}
