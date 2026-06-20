import re

with open('src/components/DashboardSidebar.tsx', 'r') as f:
    content = f.read()

# Add Input import
content = content.replace(
    "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';",
    "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { Input } from '@/components/ui/input';"
)

# Replace hasActiveFilters logic to account for Input fields and all new fields
content = content.replace(
    "const hasActiveFilters = Object.values(filters).some(v => v !== 'All');",
    "const hasActiveFilters = Object.entries(filters).some(([k, v]) => (v !== 'All' && v !== '' && v !== 'false'));"
)

# Add new inputs to the FILTERS TAB
filters_to_add = """
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Officer ID</label>
                <Input placeholder="Search by Officer ID Hash..." value={filters.officer_id} onChange={(e) => updateFilter('officer_id', e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Subject Race</label>
                <Select value={filters.subject_race} onValueChange={(val) => updateFilter('subject_race', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Races" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Races</SelectItem>
                    <SelectItem value="W">White</SelectItem>
                    <SelectItem value="B">Black</SelectItem>
                    <SelectItem value="H">Hispanic</SelectItem>
                    <SelectItem value="A">Asian</SelectItem>
                    <SelectItem value="O">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Subject Sex</label>
                <Select value={filters.subject_sex} onValueChange={(val) => updateFilter('subject_sex', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Genders" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Genders</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">County</label>
                <Input placeholder="Filter by County..." value={filters.county_name} onChange={(e) => updateFilter('county_name', e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Search Basis</label>
                <Select value={filters.search_basis} onValueChange={(val) => updateFilter('search_basis', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Search Basis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Search Basis</SelectItem>
                    <SelectItem value="Probable Cause">Probable Cause</SelectItem>
                    <SelectItem value="Consent">Consent</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Contraband Found</label>
                <Select value={filters.contraband_drugs} onValueChange={(val) => updateFilter('contraband_drugs', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Location Details</label>
                <Input placeholder="Search location text..." value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} />
              </div>
"""

# Insert the new filters right before the Reset Filters button
content = content.replace(
    "              <Button \n                variant=\"outline\"",
    filters_to_add + "\n              <Button \n                variant=\"outline\""
)

# Update Reset Filters onClick
content = content.replace(
    "onClick={() => onFilterChange({ department: 'All', year: 'All', outcome: 'All', reason: 'All' })}",
    "onClick={() => onFilterChange({ department: 'All', year: 'All', outcome: 'All', reason: 'All', officer_id: '', subject_race: 'All', subject_sex: 'All', county_name: 'All', search_basis: 'All', violation: 'All', location: '', type: 'All', arrest_made: 'All', warning_issued: 'All', contraband_drugs: 'All' })}"
)

with open('src/components/DashboardSidebar.tsx', 'w') as f:
    f.write(content)

print('Updated DashboardSidebar.tsx')
