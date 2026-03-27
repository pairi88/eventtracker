import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Tag } from 'lucide-react';
import { useCreateEvent } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function EventSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();

  const [formData, setFormData] = useState({
    name: '',
    dateTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
    location: ''
  });

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
      
      toast({
        title: "Event created successfully",
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-4 sm:mt-12">
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl">
          {/* using the generated image from requirements.yaml */}
          <img 
            src={`${import.meta.env.BASE_URL}images/event-hero.png`} 
            alt="Abstract event background" 
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">Start a New Session</h1>
            <p className="text-slate-200 text-lg">Configure event details before scanning IDs.</p>
          </div>
        </div>

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
                  onChange={e => setFormData({...formData, name: e.target.value})}
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
                    onChange={e => setFormData({...formData, dateTime: e.target.value})}
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
                    onChange={e => setFormData({...formData, location: e.target.value})}
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
      </div>
    </Layout>
  );
}
