import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Tag, History, ChevronRight, PlusCircle } from 'lucide-react';
import { useCreateEvent, useListEvents } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const LAST_EVENT_KEY = 'proseattendtrack_last_event_id';

function formatDateTime(dt: string) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dt;
  }
}

export function EventSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();
  const { data: pastEvents = [], isLoading: loadingEvents } = useListEvents();

  const [tab, setTab] = useState<'resume' | 'new'>('resume');
  const [formData, setFormData] = useState({
    name: '',
    dateTime: new Date().toISOString().slice(0, 16),
    location: ''
  });

  // Auto-redirect to last used event — only on fresh load, not if user chose to switch events
  useEffect(() => {
    const userChoseToSwitch = sessionStorage.getItem('proseattendtrack_choosing');
    if (userChoseToSwitch) {
      sessionStorage.removeItem('proseattendtrack_choosing');
      return;
    }
    const lastId = localStorage.getItem(LAST_EVENT_KEY);
    if (lastId && pastEvents.length > 0) {
      const found = pastEvents.find(e => String(e.id) === lastId);
      if (found) {
        setLocation(`/event/${found.id}`);
      }
    }
  }, [pastEvents]);

  // If no past events exist, default to the "new" tab
  useEffect(() => {
    if (!loadingEvents && pastEvents.length === 0) {
      setTab('new');
    }
  }, [loadingEvents, pastEvents.length]);

  const resumeEvent = (id: number) => {
    localStorage.setItem(LAST_EVENT_KEY, String(id));
    setLocation(`/event/${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dateTime || !formData.location) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all fields to continue."
      });
      return;
    }

    try {
      const newEvent = await createEventMutation.mutateAsync({
        data: {
          name: formData.name,
          dateTime: new Date(formData.dateTime).toISOString(),
          location: formData.location
        }
      });

      localStorage.setItem(LAST_EVENT_KEY, String(newEvent.id));

      toast({
        title: "Event created",
        description: "Ready to start scanning attendees."
      });

      setLocation(`/event/${newEvent.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: error.message || "An unexpected error occurred."
      });
    }
  };

  // Sort newest first
  const sortedEvents = [...pastEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-4 sm:mt-12">
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl">
          <img
            src={`${import.meta.env.BASE_URL}images/event-hero.png`}
            alt="Abstract event background"
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
              {tab === 'resume' ? 'Resume an Event' : 'Start a New Session'}
            </h1>
            <p className="text-slate-200 text-lg">
              {tab === 'resume' ? 'Continue scanning for an existing event.' : 'Configure event details before scanning IDs.'}
            </p>
          </div>
        </div>

        {/* Tab switcher — only show if there are past events */}
        {pastEvents.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('resume')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                tab === 'resume'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" /> Past Events
            </button>
            <button
              onClick={() => setTab('new')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                tab === 'new'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> New Event
            </button>
          </div>
        )}

        {/* Past Events Panel */}
        {tab === 'resume' && (
          <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Past Events</CardTitle>
              <CardDescription>Select an event to continue recording attendance.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : sortedEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No past events found.</p>
              ) : (
                <div className="space-y-2">
                  {sortedEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => resumeEvent(event.id)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{event.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDateTime(event.dateTime)} &nbsp;·&nbsp; {event.location}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary flex-shrink-0 ml-3 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Event Form */}
        {tab === 'new' && (
          <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Enter the specifics for today's gathering.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" /> Event Name
                  </label>
                  <Input
                    placeholder="e.g. Q3 All Hands Meeting"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" /> Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.dateTime}
                      onChange={e => setFormData({ ...formData, dateTime: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Room/Location
                    </label>
                    <Input
                      placeholder="e.g. Main Auditorium"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg shadow-primary/30"
                    disabled={createEventMutation.isPending}
                  >
                    {createEventMutation.isPending ? "Creating..." : "Start Attendance"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
