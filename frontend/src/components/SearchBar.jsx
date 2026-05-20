import React from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = React.useState("");

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Rechercher une entreprise..."
        value={query}
        onChange={handleChange}
      />
    </div>
  );
};

export default SearchBar;
