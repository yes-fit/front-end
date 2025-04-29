import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/api/mockData";
import { jsPDF } from "jspdf";

type AuditLogData = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
};

type LogsResponse = {
  logs: AuditLogData[];
  totalCount: number;
  page: number;
  totalPages: number;
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filter]);

  const fetchLogs = () => {
    setLoading(true);
    
    const response = getAuditLogs(currentPage, 20);
    setLogs(response);
    setLoading(false);
  };

  const handleGenerateReport = () => {
    if (!logs) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Enterprise Gym Audit Log Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), "MMMM do, yyyy")}`, 20, 30);
    doc.text(`Total logs: ${logs.totalCount}`, 20, 40);

    // Log headers
    const headers = ["Time", "User", "Action", "Details"];
    let y = 60;

    doc.setFontSize(14);
    doc.text("Audit Logs", 20, 50);

    doc.setFontSize(10);
    doc.text(headers[0], 20, y);
    doc.text(headers[1], 60, y);
    doc.text(headers[2], 120, y);
    doc.text(headers[3], 150, y);

    y += 10;

    // Log data - only display the first 20 for PDF
    logs.logs.slice(0, 20).forEach((log, index) => {
      if (y > 270) {
        // Add a new page if we've reached the bottom
        doc.addPage();
        y = 20;

        // Add headers to new page
        doc.text(headers[0], 20, y);
        doc.text(headers[1], 60, y);
        doc.text(headers[2], 120, y);
        doc.text(headers[3], 150, y);

        y += 10;
      }

      doc.text(format(new Date(log.timestamp), "yyyy-MM-dd HH:mm"), 20, y);
      doc.text(log.userName, 60, y);
      doc.text(log.action.replace("_", " "), 120, y);

      // Trim details to prevent overflow
      const details = log.details.length > 30 ? log.details.substring(0, 27) + "..." : log.details;
      doc.text(details, 150, y);

      y += 7;
    });

    // Save the PDF
    doc.save("gym-audit-logs.pdf");
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "booking_created":
        return "bg-blue-100 text-blue-800";
      case "booking_cancelled":
        return "bg-red-100 text-red-800";
      case "admin_action":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleNextPage = () => {
    if (logs && currentPage < logs.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const filterOptions = [
    { value: "all", label: "All Activities" },
    { value: "login", label: "Logins" },
    { value: "booking", label: "Bookings" },
    { value: "admin", label: "Admin Actions" },
  ];

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Button onClick={handleGenerateReport} disabled={!logs}>
          Export to PDF
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security Audit Trail</CardTitle>
          <CardDescription>
            Track all system activities for security compliance and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {filterOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {logs ? `Showing ${logs.logs.length} of ${logs.totalCount} logs` : "Loading..."}
              </div>
            </div>

            {loading ? (
              <div className="py-24 text-center">Loading audit logs...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.userEmail}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!logs || currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {logs?.page} of {logs?.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!logs || currentPage >= logs.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
