import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 56.1304,
  lng: -106.3468,
};

const libraries = ["places"];

function createCustomMarkerIcon(photoUrl, isSuggested) {
  const size = 60;
  const color = isSuggested ? "#e53935" : "#43a047"; // red or green
  const safeUrl = encodeURI(photoUrl || "https://placehold.co/60x60");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 12}">
      <foreignObject width="${size}" height="${size}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="border-radius:50%; overflow:hidden; width:${size}px; height:${size}px;">
          <img src="${safeUrl}" width="${size}" height="${size}" style="object-fit: cover;" />
        </div>
      </foreignObject>
      <circle cx="${size / 2}" cy="${size + 6}" r="6" fill="${color}" />
    </svg>
  `.trim();

  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(size, size + 12),
    anchor: new window.google.maps.Point(size / 2, size),
  };
}

function safePhotoUrl(url) {
  try {
    return encodeURI(url || "https://placehold.co/60x60");
  } catch {
    return "https://placehold.co/60x60";
  }
}

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

  const [redMarkerIcon, setRedMarkerIcon] = useState(null);
  const [greenMarkerIcon, setGreenMarkerIcon] = useState(null);

  const toggleLabels = React.useCallback(() => {
    if (!mapRef) return;
    setShowLabels((prev) => {
      const newVal = !prev;
      mapRef?.setMapTypeId(newVal ? "hybrid" : "roadmap");
      return newVal;
    });
  }, [mapRef]);

  // Load icons after map is ready
  const handleMapLoad = (map) => {
    setMapRef(map);
    if (window.google?.maps) {
      setRedMarkerIcon({
        url: "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png",
        scaledSize: new window.google.maps.Size(47, 73),
      });

      setGreenMarkerIcon({
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        scaledSize: new window.google.maps.Size(27, 43),
      });
    }
  };

  // Trigger search when ready
  useEffect(() => {
    if (!citySelected || !cityName || !mapRef || !shouldTriggerSearch) return;
    searchCity(cityName);
  }, [citySelected, cityName, mapRef, shouldTriggerSearch]);

  const searchCity = (city) => {
    if (!window.google || !mapRef) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;

        mapRef.panTo(location);
        mapRef.setZoom(14);

        const rawLocation = {
          lat: location.lat(),
          lng: location.lng(),
        };

        const service = new window.google.maps.places.PlacesService(mapRef);

        service.textSearch(
          {
            location: rawLocation,
            radius: 5000,
            query: "bars restaurants night club food",
          },
          (placesResults, placesStatus) => {
            if (placesStatus === "OK" && placesResults.length > 0) {
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
        options={{ mapTypeControl: false }}
        onLoad={handleMapLoad}
        onClick={() => setSelectedMarker(null)}
      >
        {/* Top-right toggle */}
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

        {/* Info window */}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ maxWidth: "220px" }}>
              {selectedMarker.photoUrl ? (
                <img
                  src={selectedMarker.photoUrl}
                  alt="Venue preview"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                />
              ) : (
                <img
                  src="https://placehold.co/400x200?text=No+Image"
                  alt={selectedMarker.name}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                />
              )}
              <h4>{selectedMarker.name}</h4>
              <p>{selectedMarker.address || "No address"}</p>
              {selectedMarker.rating && <p>⭐ {selectedMarker.rating}</p>}
            </div>
          </InfoWindow>
        )}

        {/* Markers (suggested = red, others = green) */}
        {redMarkerIcon &&
          greenMarkerIcon &&
          markers.map((marker, index) => {
            const imageUrl = safePhotoUrl(marker.photoUrl);
            const isSuggested = suggestedPlaceIds?.includes(marker.placeId);
            console.log("Rendering marker:", marker.name, createCustomMarkerIcon(imageUrl, isSuggested));
            return (
              <Marker
                key={index}
                position={{ lat: marker.lat, lng: marker.lng }}
                title={marker.name}
                icon={createCustomMarkerIcon(imageUrl, isSuggested)}
                onClick={() => {
                  const service = new window.google.maps.places.PlacesService(mapRef);
                  service.getDetails(
                    { placeId: marker.placeId, fields: ["photos"] },
                    (details, status) => {
                      const photoUrl = status === "OK"
                        ? details?.photos?.[0]?.getUrl({ maxWidth: 400 })
                        : null;
                      setSelectedMarker({ ...marker, photoUrl });
                    }
                  );
                }}
              />
            );
          })}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapPage;