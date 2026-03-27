import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus } from 'lucide-react';
import { useListStaff, useAssignBarcode, useRecordAttendance, getListStaffQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

interface AssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeId: string;
  eventId: number;
  onSuccess: (name: string) => void;
}

export function AssignDialog({ isOpen, onClose, barcodeId, eventId, onSuccess }: AssignDialogProps) {
  const [search, setSearch] = useState('');
  const { data: staffList = [], isLoading } = useListStaff();
  const assignMutation = useAssignBarcode();
  const recordMutation = useRecordAttendance();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAssign = async (staffId: number, staffName: string) => {
    try {
      // 1. Assign barcode
      await assignMutation.mutateAsync({ 
        staffId, 
        data: { barcodeId } 
      });
      
      // 2. Automatically check them in
      await recordMutation.mutateAsync({
        data: { staffId, eventId }
      });
      
      queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
      
      onSuccess(staffName);
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.message || "Failed to assign ID card.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] gap-6">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto sm:mx-0">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">New ID Detected</DialogTitle>
          <DialogDescription className="text-base">
            This card (<span className="font-mono text-xs font-bold bg-slate-100 px-1 py-0.5 rounded">{barcodeId}</span>) is not mapped to any staff member. Select a person below to assign it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or department..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="h-[250px] overflow-y-auto rounded-xl border border-border bg-slate-50/50 p-2 space-y-1 scrollbar-hide">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No staff members found matching "{search}"
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div 
                  key={staff.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-border transition-all group"
                >
                  <div>
                    <p className="font-medium text-foreground">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.department || 'No Dept'}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleAssign(staff.id, staff.name)}
                    disabled={assignMutation.isPending || recordMutation.isPending}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    Assign
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
