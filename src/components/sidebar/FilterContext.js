import React, { createContext, useMemo, useState } from "react";

export const FilterContext = createContext({
  kw: "",
  setKw: () => {},
  availabilityFilter: "",
  setAvailabilityFilter: () => {},
  preferenceFilter: "",
  setPreferenceFilter: () => {},
  cityFilter: "",
  setCityFilter: () => {},
  countryFilter: "",
  setCountryFilter: () => {},
  resetFilters: () => {},
});

export function FilterProvider({ children }) {
  const [kw, setKw] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [preferenceFilter, setPreferenceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const resetFilters = () => {
    setKw("");
    setAvailabilityFilter("");
    setPreferenceFilter("");
    setCityFilter("");
    setCountryFilter("");
  };

  const value = useMemo(
    () => ({
      kw,
      setKw,
      availabilityFilter,
      setAvailabilityFilter,
      preferenceFilter,
      setPreferenceFilter,
      cityFilter,
      setCityFilter,
      countryFilter,
      setCountryFilter,
      resetFilters,
    }),
    [kw, availabilityFilter, preferenceFilter, cityFilter, countryFilter],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
