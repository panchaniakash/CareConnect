import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface PatientsFilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function PatientsFilterSidebar({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: PatientsFilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleFilterChange = (key: string, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: "",
      dateRange: { from: undefined, to: undefined },
      ageRange: { min: "", max: "" },
      gender: "",
      clinic: "",
      hasUpcomingAppointment: false,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = Object.values(localFilters).filter(value => {
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'boolean') return value;
    if (typeof value === 'object' && value !== null) {
      if ('from' in value || 'to' in value) return (value as any).from || (value as any).to;
      if ('min' in value || 'max' in value) return (value as any).min || (value as any).max;
    }
    return false;
  }).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filter Patients
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Refine your patient search with advanced filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Patient Status */}
          <div className="space-y-2">
            <Label>Patient Status</Label>
            <Select 
              value={localFilters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Registration Date</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start text-left font-normal"
                    data-testid="filter-date-from"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange?.from ? (
                      format(localFilters.dateRange.from, "MMM dd")
                    ) : (
                      "From"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange?.from}
                    onSelect={(date) => 
                      handleFilterChange('dateRange', { 
                        ...localFilters.dateRange, 
                        from: date 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start text-left font-normal"
                    data-testid="filter-date-to"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange?.to ? (
                      format(localFilters.dateRange.to, "MMM dd")
                    ) : (
                      "To"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange?.to}
                    onSelect={(date) => 
                      handleFilterChange('dateRange', { 
                        ...localFilters.dateRange, 
                        to: date 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min age"
                  value={localFilters.ageRange?.min || ''}
                  onChange={(e) => 
                    handleFilterChange('ageRange', { 
                      ...localFilters.ageRange, 
                      min: e.target.value 
                    })
                  }
                  data-testid="filter-age-min"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max age"
                  value={localFilters.ageRange?.max || ''}
                  onChange={(e) => 
                    handleFilterChange('ageRange', { 
                      ...localFilters.ageRange, 
                      max: e.target.value 
                    })
                  }
                  data-testid="filter-age-max"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select 
              value={localFilters.gender} 
              onValueChange={(value) => handleFilterChange('gender', value)}
            >
              <SelectTrigger data-testid="filter-gender">
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clinic Location */}
          <div className="space-y-2">
            <Label>Clinic Location</Label>
            <Select 
              value={localFilters.clinic} 
              onValueChange={(value) => handleFilterChange('clinic', value)}
            >
              <SelectTrigger data-testid="filter-clinic">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All locations</SelectItem>
                <SelectItem value="main">Main Clinic</SelectItem>
                <SelectItem value="north">North Branch</SelectItem>
                <SelectItem value="south">South Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Has Upcoming Appointment */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="upcoming-appointment"
              checked={localFilters.hasUpcomingAppointment}
              onCheckedChange={(checked) => 
                handleFilterChange('hasUpcomingAppointment', checked)
              }
              data-testid="filter-upcoming-appointment"
            />
            <Label htmlFor="upcoming-appointment">
              Has upcoming appointment
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col space-y-2">
          <Button 
            onClick={applyFilters} 
            className="w-full"
            data-testid="button-apply-filters"
          >
            Apply Filters
          </Button>
          <Button 
            variant="outline" 
            onClick={clearFilters} 
            className="w-full"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs text-text-secondary">Active Filters:</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {localFilters.status && (
                <Badge variant="secondary" className="text-xs">
                  Status: {localFilters.status}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {localFilters.gender && (
                <Badge variant="secondary" className="text-xs">
                  Gender: {localFilters.gender}
                  <button
                    onClick={() => handleFilterChange('gender', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {localFilters.hasUpcomingAppointment && (
                <Badge variant="secondary" className="text-xs">
                  Has appointment
                  <button
                    onClick={() => handleFilterChange('hasUpcomingAppointment', false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}