import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, Navigation, Search, X } from "lucide-react";
import { toast } from "sonner";

interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

interface LocationInputProps {
  value: LocationValue;
  onChange: (location: LocationValue) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showCoordinates?: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    street?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

type InputMode = "initial" | "detecting" | "detected" | "manual";

export function LocationInput({
  value,
  onChange,
  placeholder = "Enter your address",
  required = false,
  error,
  showCoordinates = false,
}: LocationInputProps) {
  const [mode, setMode] = useState<InputMode>("initial");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Determine initial mode based on existing value
  useEffect(() => {
    if (value.address && value.lat && value.lng) {
      setMode("detected");
    } else if (value.address && !value.lat) {
      setMode("manual");
      setSearchQuery(value.address);
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setMode("manual");
      return;
    }

    setMode("detecting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode using Nominatim
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.error) throw new Error(data.error);

            const addr = data.address;
            const addressParts: string[] = [];
            if (addr.road || addr.street) addressParts.push(addr.road || addr.street);
            if (addr.neighbourhood || addr.suburb) addressParts.push(addr.neighbourhood || addr.suburb);
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
            if (addr.state) addressParts.push(addr.state);

            const formattedAddress =
              addressParts.length > 0
                ? addressParts.join(", ")
                : data.display_name?.split(",").slice(0, 4).join(",") || "Location detected";

            onChange({ address: formattedAddress, lat: latitude, lng: longitude });
            setMode("detected");
            toast.success("Location detected successfully");
          })
          .catch(() => {
            onChange({
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude,
            });
            setMode("detected");
            toast.info("Coordinates captured. Address could not be determined.");
          });
      },
      (error) => {
        let errorMessage = "Unable to detect location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enter address manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please enter address manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        toast.error(errorMessage);
        setMode("manual");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onChange]);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onChange({ address: query }); // Update address as user types

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  const selectSuggestion = (suggestion: NominatimResult) => {
    const addr = suggestion.address;
    let formattedAddress = suggestion.display_name;

    // Build a shorter address if we have address components
    if (addr) {
      const parts: string[] = [];
      if (addr.road || addr.street) parts.push(addr.road || addr.street);
      if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
      if (addr.state) parts.push(addr.state);
      if (parts.length > 0) formattedAddress = parts.join(", ");
    }

    onChange({
      address: formattedAddress,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSearchQuery(formattedAddress);
    setShowSuggestions(false);
    setMode("detected");
  };

  const handleChangeLocation = () => {
    setMode("initial");
    setSearchQuery("");
    setSuggestions([]);
    onChange({ address: "" });
  };

  const handleEnterManually = () => {
    setMode("manual");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const linkStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "center",
    padding: "8px",
  };

  const detectedBoxStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "10px",
  };

  const inputContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px 12px 40px",
    fontSize: "14px",
    border: error ? "1px solid #ef4444" : "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    outline: "none",
  };

  const suggestionsStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 50,
  };

  const suggestionItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    transition: "background-color 0.15s",
  };

  // Render based on mode
  if (mode === "initial") {
    return (
      <div style={containerStyle}>
        <button
          type="button"
          onClick={detectLocation}
          style={buttonPrimaryStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
        >
          <Navigation style={{ width: "16px", height: "16px" }} />
          Detect My Location
        </button>
        <button type="button" onClick={handleEnterManually} style={linkStyle}>
          or enter address manually
        </button>
        {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{error}</p>}
      </div>
    );
  }

  if (mode === "detecting") {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "16px",
            backgroundColor: "#f1f5f9",
            borderRadius: "10px",
          }}
        >
          <Loader2 style={{ width: "20px", height: "20px", color: "#1e293b", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "14px", color: "#374151" }}>Detecting your location...</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (mode === "detected") {
    return (
      <div style={containerStyle}>
        <div style={detectedBoxStyle}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#dcfce7",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin style={{ width: "20px", height: "20px", color: "#16a34a" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0, wordBreak: "break-word" }}>
              {value.address}
            </p>
            {showCoordinates && value.lat && value.lng && (
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                GPS: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleChangeLocation}
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#9ca3af",
            }}
            title="Change location"
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        </div>
        {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{error}</p>}
      </div>
    );
  }

  // Manual mode
  return (
    <div style={containerStyle}>
      <div style={inputContainerStyle}>
        <Search
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "#9ca3af",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
        />
        {loadingSuggestions && (
          <Loader2
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "#9ca3af",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} style={suggestionsStyle}>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => selectSuggestion(suggestion)}
                style={suggestionItemStyle}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <MapPin style={{ width: "14px", height: "14px", color: "#9ca3af", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {suggestion.display_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={detectLocation}
        style={{
          ...linkStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          color: "#1e293b",
        }}
      >
        <Navigation style={{ width: "14px", height: "14px" }} />
        Use current location instead
      </button>
      {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{error}</p>}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
