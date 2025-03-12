"use client";

import { Camera, MapPin, Navigation, PencilLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StoredLocation {
  address: string;
  region: string;
  timestamp: number;
}

interface SearchResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    state?: string;
    province?: string;
    country?: string;
  };
}

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "INR", name: "Indian Rupee" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "ZAR", name: "South African Rand" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "BRL", name: "Brazilian Real" }
];

const LOCATION_EXPIRY = 3600000; // 1 hour in milliseconds
const SEARCH_DEBOUNCE = 300; // 300ms debounce for search

export default function Home() {
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    // Load location and currency from localStorage on component mount
    const storedLocation = localStorage.getItem("userLocation");
    const savedCurrency = localStorage.getItem("defaultCurrency");
    
    if (storedLocation) {
      const { address, region, timestamp }: StoredLocation = JSON.parse(storedLocation);
      const now = Date.now();
      
      if (now - timestamp < LOCATION_EXPIRY) {
        setLocation(address);
      } else {
        localStorage.removeItem("userLocation");
      }
    }

    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const formatRegion = (addressDetails: any): string => {
    const parts = [];
    
    if (addressDetails.city) {
      parts.push(addressDetails.city);
    } else if (addressDetails.town) {
      parts.push(addressDetails.town);
    }
    
    if (addressDetails.state) {
      parts.push(addressDetails.state);
    } else if (addressDetails.province) {
      parts.push(addressDetails.province);
    }
    
    if (addressDetails.country) {
      parts.push(addressDetails.country);
    }
    
    return parts.join(", ");
  };

  const formatDisplayName = (result: SearchResult): string => {
    const parts = [];
    const addr = result.address;

    if (addr.city || addr.town) {
      parts.push(addr.city || addr.town);
    }
    if (addr.state || addr.province) {
      parts.push(addr.state || addr.province);
    }
    if (addr.country) {
      parts.push(addr.country);
    }

    return parts.join(", ");
  };

  const updateLocation = (address: string, region: string) => {
    setLocation(address);
    const locationData: StoredLocation = {
      address,
      region,
      timestamp: Date.now()
    };
    localStorage.setItem("userLocation", JSON.stringify(locationData));
    localStorage.setItem("defaultRegion", region);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem("defaultCurrency", value);
  };

  const searchLocation = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=city&featuretype=state&featuretype=country`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'PriceScanner/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search locations");
      }

      const results = await response.json();
      
      // Filter results to only include locations with city/state/country
      const filteredResults = results.filter((result: SearchResult) => {
        const addr = result.address;
        return (addr.city || addr.town || addr.state || addr.province || addr.country);
      });

      setSearchResults(filteredResults);
      setOpen(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      toast({
        variant: "destructive",
        title: "Error searching locations",
        description: "Please try again later.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationInput = (value: string) => {
    setLocation(value);
    
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      searchLocation(value);
    }, SEARCH_DEBOUNCE);
  };

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'PriceScanner/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get address");
      }

      const data = await response.json();
      const region = formatRegion(data.address);
      const displayName = formatDisplayName({ display_name: "", address: data.address });
      
      updateLocation(displayName, region);
      
      toast({
        title: "Location detected",
        description: "Your location has been updated successfully.",
      });
    } catch (error) {
      console.error("Error detecting location:", error);
      toast({
        variant: "destructive",
        title: "Error detecting location",
        description: "Please make sure location services are enabled.",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              <span className="text-5xl">Price Tag</span>
              <br />
              <span className="text-4xl">Currency Converter</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Scan price tags and get instant currency conversion and tax calculations
            </p>
          </div>

          <Card className="glass-card p-6 rounded-2xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-lg">
                  My Home Currency
                </Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger id="currency" className="glass-input h-12">
                    <SelectValue placeholder="Select your currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-lg">
                  Select your Current Location
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-black" />
                      </div>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Search location..."
                        value={location}
                        onChange={(e) => handleLocationInput(e.target.value)}
                        className="pl-12 pr-20 h-12 glass-input"
                      />
                      <Button
                        variant="ghost"
                        size="default"
                        className="absolute right-0 top-0 h-full px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          detectLocation();
                        }}
                        disabled={isDetecting}
                      >
                        <Navigation className={`h-5 w-5 ${isDetecting ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 rounded-xl" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>No locations found</CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((result, index) => (
                            <CommandItem
                              key={index}
                              onSelect={() => {
                                const displayName = formatDisplayName(result);
                                const region = formatRegion(result.address);
                                updateLocation(displayName, region);
                                setOpen(false);
                              }}
                            >
                              <MapPin className="mr-2 h-4 w-4" />
                              {formatDisplayName(result)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/scan" className="flex-1">
                  <Button 
                    className="w-full text-base h-12 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                    size="default"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan Price Tag
                  </Button>
                </Link>

                <Link href="/enter" className="flex-1">
                  <Button 
                    className="w-full text-base h-12 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                    size="default"
                  >
                    <PencilLine className="mr-2 h-5 w-5" />
                    Enter Price Tag
                  </Button>
                </Link>
              </div>

              <Link href="/list" className="block">
                <Button 
                  variant="outline" 
                  className="w-full h-10 glass-button rounded-xl"
                >
                  View List
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}