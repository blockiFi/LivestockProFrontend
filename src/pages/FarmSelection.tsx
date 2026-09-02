import { useSelector } from "react-redux";
import store, { type RootState } from "../store/index";
import { useEffect, useState, type ReactElement } from "react";
import { type Farm } from "@/lib/types";
import type { FarmRequestData } from "@/lib/interfaces";
import { createFarm, getCountries, getUserFarms, GetToken, StoreFarm, type CountryOption } from "@/lib/request";
import { LoadFarmPermissions } from "@/lib/loader";
import { setActiveFarm, setUser } from "@/store/AuthenticationSlice";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  Fish,
  Layers,
  MapPin,
  PiggyBank,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/navigation/TopBar";
import { toast } from "react-toastify";
function FarmSelection() {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.authentication.token);
  const CurrentUser = useSelector((state: RootState) => state.authentication.user);
  const [farms, setFarms] = useState<Farm[] | null>(CurrentUser?.farms ?? null);
  const [countries, setCountries] = useState<CountryOption[]>([]);

  useEffect(() => {
    const loadFarms = async (_token: string): Promise<FarmRequestData> => {
      const response = await getUserFarms(token);
      if (response.success) {
        if (CurrentUser) {
          const updatedUser = {
            ...CurrentUser,
            farms: response.data,
          };
          setFarms(response.data ?? null);
          store.dispatch(setUser(updatedUser));
        }
      }
      return response;
    };

    if (CurrentUser?.farms == null) {
      loadFarms(token);
    }
  }, []);

  const selectFarm = (farmID: number) => {
    const activeFarm = farms?.find((farm) => farm.id === farmID);
    if (activeFarm) {
      StoreFarm(activeFarm);
      store.dispatch(setActiveFarm(activeFarm));
    }
  };

  const handleFarmSelect = async (farmID: number) => {
    selectFarm(farmID);
    await LoadFarmPermissions(true);
    navigate(`/dashboard`);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country_id: "",
    size_hectares: "",
    established_date: "",
    phone: "",
    email: "",
    postal_code: "",
    website: "",
    registration_number: "",
  });

  useEffect(() => {
    const loadCountries = async () => {
      if (!token) return;
      const res = await getCountries(token);
      if (res.success && res.data) setCountries(res.data);
    };
    loadCountries();
  }, [token]);

  const handleCreateFarm = async () => {
    const authToken = token || GetToken() || "";
    if (!authToken) {
      toast.error("You must be logged in to create a farm.");
      return;
    }
    if (!createForm.name.trim()) return toast.error("Farm name is required");
    if (!createForm.address.trim()) return toast.error("Address is required");
    if (!createForm.city.trim()) return toast.error("City is required");
    if (!createForm.state.trim()) return toast.error("State is required");
    const countryId = Number(createForm.country_id);
    if (!Number.isFinite(countryId) || countryId <= 0) return toast.error("Please select a country");

    setIsCreatingFarm(true);
    console.log("Creating farm payload:", { ...createForm, country_id: countryId });
    const res = await createFarm(authToken, {
      name: createForm.name.trim(),
      address: createForm.address.trim(),
      city: createForm.city.trim(),
      state: createForm.state.trim(),
      country_id: countryId,
      size_hectares: createForm.size_hectares ? Number(createForm.size_hectares) : null,
      established_date: createForm.established_date || null,
      phone: createForm.phone || null,
      email: createForm.email || null,
      postal_code: createForm.postal_code || null,
      website: createForm.website || null,
      registration_number: createForm.registration_number || null,
    });

    if (res.success && res.data) {
      toast.success("Farm created successfully");
      // refresh farms list so user state stays correct
      const farmsRes = await getUserFarms(authToken);
      if (farmsRes.success && farmsRes.data) {
        setFarms(farmsRes.data ?? null);
        if (CurrentUser) {
          store.dispatch(setUser({ ...CurrentUser, farms: farmsRes.data }));
        }
      } else {
        // fallback: append created farm to local list
        setFarms((prev) => (prev ? [res.data!, ...prev] : [res.data!]));
      }

      // select farm & continue
      StoreFarm(res.data);
      store.dispatch(setActiveFarm(res.data));
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: "",
        address: "",
        city: "",
        state: "",
        country_id: "",
        size_hectares: "",
        established_date: "",
        phone: "",
        email: "",
        postal_code: "",
        website: "",
        registration_number: "",
      });
      navigate("/dashboard");
    } else {
      console.log("Create farm failed:", res);
      res.error?.forEach((e) => toast.error(e));
    }

    setIsCreatingFarm(false);
  };

  const filteredFarms = farms?.filter((farm) => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.address.toLowerCase().includes(searchTerm.toLowerCase());
    const typeValue = (farm as any).type ?? (farm as any).farm_type ?? "mixed";
    const matchesType = selectedType === "all" || typeValue === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "poultry":
        return <Layers className="h-5 w-5" />;
      case "piggery":
        return <PiggyBank className="h-5 w-5" />;
      case "fishery":
        return <Fish className="h-5 w-5" />;
      case "mixed":
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
      case 0:
      default:
        return "bg-slate-700/40 text-slate-200 border border-slate-600";
    }
  };

  const farmsCount = filteredFarms?.length ?? 0;

  const handleQuickNavigate = (farmId: number, path: string) => {
    selectFarm(farmId);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 text-gray-900">
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero section */}
        <div className="mb-8 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Farm workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose a farm to manage operations
            </h1>
            <p className="text-sm text-gray-600 sm:text-base max-w-xl">
              Switch between farms and jump straight into flocks, feed, health schedules, and inventory
              with a single click. Your team permissions follow automatically.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <Layers className="h-3 w-3" />
                {farmsCount} {farmsCount === 1 ? "active farm" : "active farms"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                <Users className="h-3 w-3" />
                Team-ready access
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Create a new farm</p>
              <span className="text-[11px] text-gray-500">
                Onboard in under 2 minutes
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-600">
              Quickly register a new farm and start tracking flocks, inventory, and health programs with
              Farm Central’s guided setup.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-md hover:bg-emerald-600">
                  <Plus className="h-4 w-4" />
                  New farm
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create new farm</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="farm-name">Farm name</Label>
                    <Input
                      id="farm-name"
                      placeholder="Enter farm name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="farm-address">Address</Label>
                    <Input
                      id="farm-address"
                      placeholder="Street / area"
                      value={createForm.address}
                      onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-city">City</Label>
                      <Input
                        id="farm-city"
                        placeholder="City"
                        value={createForm.city}
                        onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-state">State</Label>
                      <Input
                        id="farm-state"
                        placeholder="State"
                        value={createForm.state}
                        onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="farm-country">Country</Label>
                    <Select
                      value={createForm.country_id}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, country_id: v }))}
                    >
                      <SelectTrigger id="farm-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-size">Farm size (hectares)</Label>
                      <Input
                        id="farm-size"
                        placeholder="e.g., 25"
                        value={createForm.size_hectares}
                        onChange={(e) => setCreateForm((p) => ({ ...p, size_hectares: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-established">Established date</Label>
                      <Input
                        id="farm-established"
                        type="date"
                        value={createForm.established_date}
                        onChange={(e) => setCreateForm((p) => ({ ...p, established_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-phone">Phone (optional)</Label>
                      <Input
                        id="farm-phone"
                        placeholder="+234..."
                        value={createForm.phone}
                        onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-email">Email (optional)</Label>
                      <Input
                        id="farm-email"
                        type="email"
                        placeholder="farm@email.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-postal">Postal code (optional)</Label>
                      <Input
                        id="farm-postal"
                        placeholder="Postal code"
                        value={createForm.postal_code}
                        onChange={(e) => setCreateForm((p) => ({ ...p, postal_code: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="farm-website">Website (optional)</Label>
                      <Input
                        id="farm-website"
                        placeholder="https://"
                        value={createForm.website}
                        onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="farm-reg">Registration number (optional)</Label>
                    <Input
                      id="farm-reg"
                      placeholder="Optional registration number"
                      value={createForm.registration_number}
                      onChange={(e) => setCreateForm((p) => ({ ...p, registration_number: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                      onClick={handleCreateFarm}
                      disabled={isCreatingFarm}
                    >
                      {isCreatingFarm ? "Creating..." : "Create farm"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search farms by name or location..."
              className="h-10 border-gray-300 bg-white pl-10 text-sm text-gray-900 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-10 w-full border-gray-300 bg-white text-sm text-gray-900 sm:w-52">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="poultry">Poultry</SelectItem>
              <SelectItem value="piggery">Piggery</SelectItem>
              <SelectItem value="fishery">Fishery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Farm Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarms?.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              getTypeIcon={getTypeIcon}
              getStatusColor={getStatusColor}
              onSelect={() => handleFarmSelect(farm.id)}
              onQuickNavigate={(path) => handleQuickNavigate(farm.id, path)}
            />
          ))}
        </div>

        {filteredFarms && filteredFarms.length === 0 && (
          <div className="py-16 text-center">
            <Layers className="mx-auto mb-4 h-10 w-10 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No farms found</h3>
            <p className="mb-4 text-sm text-gray-600">
              {searchTerm || selectedType !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first farm to start managing flocks, feed, and health schedules."}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Create your first farm
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

type FarmCardProps = {
  farm: Farm;
  getTypeIcon: (type: string) => ReactElement;
  getStatusColor: (status: number) => string;
  onSelect: () => void;
  onQuickNavigate: (path: string) => void;
};

const FarmCard = ({
  farm,
  getTypeIcon,
  getStatusColor,
  onSelect,
  onQuickNavigate,
}: FarmCardProps) => {
  const typeValue = (farm as any).type ?? (farm as any).farm_type ?? "mixed";

  return (
    <Card
      className="h-full cursor-pointer overflow-hidden border-gray-200 bg-white/90 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-md"
      onClick={onSelect}
    >
      {/* Gradient top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />

      <CardHeader className="pb-3 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
              {getTypeIcon(typeValue)}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 truncate">
                {farm.name}
              </CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[8rem] sm:max-w-[11rem] md:max-w-[14rem] lg:max-w-xs break-words">
                  {farm.address}
                </span>
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`px-2 py-0.5 text-[10px] capitalize whitespace-nowrap ${getStatusColor(
              farm.status as number,
            )}`}
          >
            {farm.status === 1 ? "active" : "inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between space-y-4">
        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Farm size</span>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {farm.size_hectares ? `${farm.size_hectares} ha` : "Not set"}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {farm.created_at
                ? new Date(farm.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Meta & quick badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              <Layers className="h-3 w-3" />
              {typeValue.charAt(0).toUpperCase() + typeValue.slice(1)} farm
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
              <Users className="h-3 w-3" />
              Team-ready
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Recent activity</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-gray-200 bg-white text-[11px] text-gray-800 hover:border-emerald-400 hover:text-emerald-600"
            onClick={(e) => {
              e.stopPropagation();
              onQuickNavigate("/dashboard");
            }}
          >
            Dashboard
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-gray-200 bg-white text-[11px] text-gray-800 hover:border-emerald-400 hover:text-emerald-600"
            onClick={(e) => {
              e.stopPropagation();
              onQuickNavigate("/dashboard/poultry/flock-management");
            }}
          >
            Flocks
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-gray-200 bg-white text-[11px] text-gray-800 hover:border-emerald-400 hover:text-emerald-600"
            onClick={(e) => {
              e.stopPropagation();
              onQuickNavigate("/dashboard/poultry/inventory/feeds");
            }}
          >
            Inventory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmSelection;
