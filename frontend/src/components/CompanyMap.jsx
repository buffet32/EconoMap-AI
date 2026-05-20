import React from "react";

const CompanyMap = ({ companies }) => {
  // Placeholder : affiche le nombre d'entreprises sur la "carte"
  return (
    <div className="company-map">
      <h3>Carte des entreprises</h3>
      <p>{companies ? companies.length : 0} entreprises affichées sur la carte.</p>
      {/* Intégration d'une vraie carte (Leaflet, Google Maps...) possible ici */}
    </div>
  );
};

export default CompanyMap;
