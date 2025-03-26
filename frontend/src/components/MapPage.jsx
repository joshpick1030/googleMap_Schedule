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
  const [showLabels, setShowLabels] = useState(false);

  const toggleLabels = () => {
    if (!mapRef) return;

    const newShowLabels = !showLabels;
    setShowLabels(newShowLabels);

    mapRef.setMapTypeId(newShowLabels ? "hybrid" : "satellite");
  };

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
            radius: 1500,
            query: "bars restaurants night club food"
          },
          (placesResults, placesStatus) => {
            if (placesStatus === "OK" && placesResults.length > 0) {
              // Now enrich with photo URLs
              const enrichPlace = (place) =>
                new Promise((resolve) => {
                  service.getDetails(
                    {
                      placeId: place.place_id,
                      fields: ["photos", "types", "opening_hours"]
                    },
                    (details, status) => {
                      const photoUrl = status === "OK"
                        ? details?.photos?.[0]?.getUrl({ maxWidth: 400 })
                        : null;

                      const jsDay = new Date().getDay();
                      const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
                      const weekdayText = details?.opening_hours?.weekday_text || [];
                      const todayHours = weekdayText.length ? weekdayText[todayIndex] : null;
                                
                      resolve({
                        placeId: place.place_id,
                        name: place.name,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.vicinity || place.formatted_address,
                        rating: place.rating,
                        photoUrl,
                        types: place.types, // needed for filtering
                        openNow: details?.opening_hours?.open_now ?? null,
                        todayHours
                      });
                    }
                  );
                });
        
              Promise.all(placesResults.map(enrichPlace)).then((enrichedPlaces) => {
                setMarkers(enrichedPlaces);
                onVenueResults(enrichedPlaces);
              });
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
        mapTypeId="satellite"
        options={{
          mapTypeControl: false, // hides Map/Satellite switcher
        }}
        onLoad={(map) => setMapRef(map)}
        onClick={() => {
          setSelectedMarker(null); // clear info window if background clicked
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 5,
            background: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
            fontSize: "0.9rem"
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={toggleLabels}
              style={{ marginRight: "6px" }}
            />
            Show Labels
          </label>
        </div>

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >

            <div style={{ maxWidth: "220px" }}>
              {/* Image preview */}
              {selectedMarker.photoUrl ? (
                <img
                  src={selectedMarker.photoUrl}
                  alt="Venue preview"
                  style={{ width: "100%", borderRadius: "8px", marginBottom: "8px" }}
                />
              ) : (
                <img
                  src="https://placehold.co/400x200?text=No+Image"
                  alt={selectedMarker.name}
                  style={{ width: "100%", borderRadius: "8px", marginBottom: "8px" }}
                />
              )}

              <h4>{selectedMarker.name}</h4>
              <p>{selectedMarker.address || "No address"}</p>
              {selectedMarker.rating && <p>⭐ {selectedMarker.rating}</p>}
            </div>
          </InfoWindow>
        )}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.name}
            onClick={() => {
              const service = new window.google.maps.places.PlacesService(mapRef);
              
              // Helper to fetch photoUrl for each place using placeId
              service.getDetails(
                {
                  placeId: marker.placeId,
                  fields: ["photos"]
                },
                (details, status) => {
                  if (status === "OK") {
                    const photoUrl = details?.photos?.[0]?.getUrl({
                      maxWidth: 400
                    }) || null;
                    setSelectedMarker({ ...marker, photoUrl });
                  } else {
                    setSelectedMarker(marker); // fallback
                  }
                }
              );
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapPage;
