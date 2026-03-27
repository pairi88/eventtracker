import React from 'react';
import { useParams, Link } from 'wouter';
import { useGetEvent, useGetEventAttendance, useExportAttendanceCsv } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Users, Clock } from 'lucide-react';

export function AttendanceLog() {
  const { eventId } = useParams<{ eventId: string }>();
  const numericEventId = parseInt(eventId || '0', 10);

  const { data: event, isLoading: isLoadingEvent } = useGetEvent(numericEventId);
  const { data: attendance = [], isLoading: isLoadingAttendance } = useGetEventAttendance(numericEventId, {
    query: { refetchInterval: 10000 } // Auto-refresh every 10s
  });
  
  // Prepare export query but don't run it immediately
  const exportQuery = useExportAttendanceCsv(numericEventId, {
    query: { enabled: false }
  });

  const handleExport = async () => {
    try {
      const { data } = await exportQuery.refetch();
      if (!data) return;
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${event?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href={`/event/${numericEventId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scanner
            </Link>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isLoadingEvent ? 'Loading...' : event?.name}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> {attendance.length} Attendees Checked In
            </p>
          </div>
          
          <Button onClick={handleExport} disabled={exportQuery.isFetching || attendance.length === 0} className="sm:w-auto w-full gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <Card className="shadow-md border-0 bg-white/60 backdrop-blur-sm overflow-hidden">
          {isLoadingAttendance ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              Loading attendance records...
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No attendees yet</h3>
              <p className="text-muted-foreground">Scan ID cards to see them appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Name</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Time Scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">{record.staffName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {record.staffId}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(record.checkedInAt), 'h:mm a')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
