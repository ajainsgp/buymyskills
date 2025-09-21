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
  categoryFilter: "",
  setCategoryFilter: () => {},
  resetFilters: () => {},
});

export function FilterProvider({ children }) {
  const [kw, setKw] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [preferenceFilter, setPreferenceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const resetFilters = () => {
    setKw("");
    setAvailabilityFilter("");
    setPreferenceFilter("");
    setCityFilter("");
    setCountryFilter("");
    setCategoryFilter("");
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
      categoryFilter,
      setCategoryFilter,
      resetFilters,
    }),
    [
      kw,
      availabilityFilter,
      preferenceFilter,
      cityFilter,
      countryFilter,
      categoryFilter,
    ],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
