// MapPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, LoadScript, OverlayView } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 56.1304,
  lng: -106.3468,
};

const libraries = ["places"];

function MapPage({
  cityName,
  citySelected,
  onVenueResults,
  shouldTriggerSearch,
  suggestedPlaceIds,
}) {
  const [mapRef, setMapRef] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showLabels, setShowLabels] = useState(false);

  const handleMapLoad = (map) => setMapRef(map);

  const toggleLabels = () => {
    if (!mapRef) return;
    const newShowLabels = !showLabels;
    setShowLabels(newShowLabels);
    mapRef.setMapTypeId(newShowLabels ? "hybrid" : "satellite");
  };

  useEffect(() => {
    if (!citySelected || !cityName || !mapRef || !shouldTriggerSearch) return;
    searchCity(cityName);
  }, [citySelected, cityName, mapRef, shouldTriggerSearch]);

  const searchCity = (city) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        mapRef.panTo(location);
        mapRef.setZoom(13);

        const service = new window.google.maps.places.PlacesService(mapRef);
        service.textSearch(
          {
            location,
            radius: 5000,
            query: "bars restaurants night club food",
          },
          (placesResults, placesStatus) => {
            if (placesStatus === "OK") {
              const enrichPlace = (place) =>
                new Promise((resolve) => {
                  service.getDetails(
                    {
                      placeId: place.place_id,
                      fields: ["photos", "types", "opening_hours"],
                    },
                    (details, status) => {
                      const photoUrl =
                        status === "OK"
                          ? details?.photos?.[0]?.getUrl({ maxWidth: 400 })
                          : null;

                      const jsDay = new Date().getDay();
                      const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
                      const weekdayText = details?.opening_hours?.weekday_text || [];
                      const todayHours =
                        weekdayText.length > 0 ? weekdayText[todayIndex] : null;

                      resolve({
                        placeId: place.place_id,
                        name: place.name,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.vicinity || place.formatted_address,
                        rating: place.rating,
                        photoUrl,
                        types: place.types,
                        openNow: details?.opening_hours?.open_now ?? null,
                        todayHours,
                      });
                    }
                  );
                });

              Promise.all(placesResults.map(enrichPlace)).then((enriched) => {
                setMarkers(enriched);
                onVenueResults(enriched);
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

  const renderMarker = (marker) => {
    const isSuggested = suggestedPlaceIds.includes(marker.placeId);
    const color = isSuggested ? "#e53935" : "#43a047";
    return (
      <OverlayView
        key={marker.placeId}
        position={{ lat: marker.lat, lng: marker.lng }}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      >
        <div
          onClick={() => setSelectedMarker(marker)}
          style={{
            width: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "translate(-50%, -100%)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "white",
              padding: 2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src={marker.photoUrl || "https://placekitten.com/60/60"}
              alt={marker.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>
          <div
            style={{
              width: 10,
              height: 10,
              marginTop: 4,
              borderRadius: "50%",
              background: color,
            }}
          ></div>
        </div>
      </OverlayView>
    );
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyD2AooHp8vIc_k3EmMurnBHm5h7qhu7DUI" libraries={libraries}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={4}
        mapTypeId="satellite"
        options={{ mapTypeControl: false }}
        onLoad={handleMapLoad}
        onClick={() => setSelectedMarker(null)}
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
            fontSize: "0.9rem",
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

        {markers.map(renderMarker)}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapPage;
