import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%"
};

const defaultCenter = {
  lat: 56.1304,
  lng: -106.3468
};

const libraries = ["places"];

function MapPage({ cityName, citySelected, onVenueResults }) {
  const [mapRef, setMapRef] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // When citySelected changes from false->true, we do geocode + nearSearch
  useEffect(() => {
    if (!citySelected || !cityName || !mapRef) return;
    searchCity(cityName);
  }, [citySelected, cityName, mapRef]);

  const searchCity = (city) => {
    if (!window.google || !mapRef) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;

        mapRef.panTo(location);
        mapRef.setZoom(13);

        const rawLocation = {
          lat: location.lat(),
          lng: location.lng()
        };

        // ✅ PlacesService tied to actual map instance
        const service = new window.google.maps.places.PlacesService(mapRef);

        service.textSearch(
          {
            location: rawLocation,
            radius: 8000,
            query: "bars restaurants night club food"
          },
          (placesResults, placesStatus) => {
            if (placesStatus === "OK" && placesResults.length > 0) {
              setMarkers(
                placesResults.map((place) => ({
                  name: place.name,
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  address: place.vicinity || place.formatted_address,
                  rating: place.rating
                }))
              );
              onVenueResults(placesResults);
            } else {
              onVenueResults([]);
            }
          }
        );
      } else {
        alert("City not found");
      }
    });
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyD2AooHp8vIc_k3EmMurnBHm5h7qhu7DUI"
      libraries={libraries}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={4}
        onLoad={(map) => setMapRef(map)}
      >
        {selectedMarker && (
          <InfoWindow
            position={{ lat:selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick= {() => setSelectedMarker(null)}
          >
            <div style={{ maxWidth: "200px" }}>
              <h4 style= {{margin: "0 0 4px" }}>{selectedMarker.name}</h4>
              <p style={{ margin: "0" }}>{selectedMarker.address || "No address provided"}</p>
                {selectedMarker.rating && (
                  <p style={{ margin: "4px 0 0" }}>⭐ {selectedMarker.rating}</p>
                )}
            </div>
          </InfoWindow>
        )}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.name}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapPage;
