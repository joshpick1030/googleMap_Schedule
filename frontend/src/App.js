import React, { useState } from "react";
import MapPage from "./components/MapPage";
import QuestionFlow from "./components/QuestionFlow";
import GoogleLoginButton from "./components/GoogleLoginButton";
import "./App.css";
import { useNavigate } from "react-router-dom";
import CityModal from "./components/CityModal";
import { Modal, Box } from "@mui/material";

function ProcessingScreen({ onFinish }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="processing-overlay">
      <div className="processing-panel">
        <div className="spinner" />
        <h2>Processing your schedule...</h2>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cityName, setCityName] = useState("");
  const [citySelected, setCitySelected] = useState(false);
  const [allPlaces, setAllPlaces] = useState([]);
  const [questionDone, setQuestionDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cityModalMinimized, setCityModalMinimized] = useState(false);
  const [suggestedPlaceIds, setSuggestedPlaceIds] = useState([]);

  React.useEffect(() => {
    const saved = localStorage.getItem("eventai_user");
    if (saved) {
      const { user, timestamp } = JSON.parse(saved);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      if (now - timestamp < tenMinutes) {
        setUser(user);
      } else {
        localStorage.removeItem("eventai_user");
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    const loginData = {
      user: userData,
      timestamp: Date.now(),
    };
    localStorage.setItem("eventai_user", JSON.stringify(loginData));
  };

  const handleCityConfirm = (city) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === "OK" && results[0]) {
        setCityName(city);
        setCitySelected(true);
        setQuestionDone(false);
        setAllPlaces([]);
        setCityModalMinimized(true);
        setSuggestedPlaceIds([]);
      } else {
        alert("City not found");
      }
    });
  };

  const handleVenueResults = (places) => {
    setAllPlaces(places);
  };

  const handleQuestionComplete = (userAnswers) => {
    const wantsToEat = userAnswers.eat?.toLowerCase() === "yes";
    const spots = parseInt(userAnswers.spots || "3", 10);
    let filtered = allPlaces.filter((place) => {
      const types = place.types || [];
      return wantsToEat
        ? types.includes("restaurant") ||
            types.includes("food") ||
            types.includes("cafe") ||
            types.includes("meal_takeaway")
        : types.includes("bar") || types.includes("night_club");
    });

    let openNowFiltered = filtered.filter((place) => place.openNow === true);
    if (openNowFiltered.length < spots) {
      const fallback = filtered.filter((p) => p.openNow !== true);
      openNowFiltered = [...openNowFiltered, ...fallback];
    }

    const finalSuggested = openNowFiltered.slice(0, spots);
    setSuggestedPlaceIds(finalSuggested.map((p) => p.placeId));
    setQuestionDone(true);
    setProcessing(true);
  };

  const handleProcessingDone = () => {
    setProcessing(false);
  };

  const suggestedPlaces = allPlaces.filter((place) =>
    suggestedPlaceIds.includes(place.placeId)
  );

  return (
    <div className="app-container">
      {user && (
        <div className="sidebar">
          <h2> Welcome, {user.name}!</h2>
          <button
            className="logout-button"
            onClick={() => {
              const confirmed = window.confirm("Are you sure you want to log out?");
              if (confirmed) {
                setUser(null);
                localStorage.removeItem("eventai_user");
                navigate("/");
              }
            }}
          >
            🔒 Logout
          </button>

          {questionDone && !processing && (
            <>
              <h3>Your Canada Day Itinerary</h3>
              {suggestedPlaces.map((venue, i) => (
                <div className="venue" key={i}>
                  {venue.photoUrl ? (
                    <img
                      src={venue.photoUrl}
                      alt={venue.name}
                      className="venue-photo"
                    />
                  ) : (
                    <img
                      src="https://placehold.co/400x200?text=No+Image"
                      alt="No Preview"
                      className="venue-photo"
                    />
                  )}
                  <h4>{venue.name}</h4>
                  <p>{venue.address || venue.vicinity || "No address provided"}</p>
                  <p
                    style={{
                      color:
                        venue.openNow === true
                          ? "green"
                          : venue.openNow === false
                          ? "red"
                          : "gray",
                      fontWeight: "bold",
                      margin: "0.3rem 0",
                    }}
                  >
                    {venue.openNow === true
                      ? "🟢 Open Now"
                      : venue.openNow === false
                      ? "🔴 Closed"
                      : "⏳ Hours Unknown"}
                  </p>
                  <p>⭐ {venue.rating || "N/A"}</p>
                  {venue.openNow !== true && venue.todayHours && (
                    <p
                      style={{
                        fontStyle: "italic",
                        color: "#666",
                        fontSize: "0.85rem",
                      }}
                    >
                      {venue.todayHours}
                    </p>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "0.5rem",
                      color: "#007bff",
                      textDecoration: "underline",
                    }}
                  >
                    🧭 Get Directions
                  </a>
                </div>
              ))}
              {suggestedPlaces.length === 0 && (
                <p>No matching venues found. Try a bigger city or different answers!</p>
              )}
              <a
                href="https://yourshop.com/shirt"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "1rem",
                  textDecoration: "none",
                }}
              >
                🛍️ Buy Canada Day Shirt
              </a>
            </>
          )}
        </div>
      )}

      <div className="map-container">
        {!user && (
          <div className="search-bar">
            <p style={{ margin: 0 }}>Login to begin:</p>
            <GoogleLoginButton onSuccess={handleLoginSuccess} />
          </div>
        )}

        {user && (
          <CityModal
            open={true}
            minimized={cityModalMinimized}
            cityName={cityName}
            onChange={(value) => setCityName(value)}
            onConfirm={() => {
              if (!cityName || cityName.trim().length < 3) {
                alert("Please enter a valid city name.");
                return;
              }
              handleCityConfirm(cityName.trim());
            }}
            onLater={() => setCityModalMinimized(true)}
            onMaximize={() => {
              setCityModalMinimized(false);
              setCitySelected(false);
            }}
          />
        )}

        {user && citySelected && !questionDone && (
          <Modal
            open={true}
            disableEnforceFocus
            disableAutoFocus
            disableEscapeKeyDown
            hideBackdrop
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: "90%",
                maxWidth: 500,
                bgcolor: "white",
                boxShadow: 24,
                p: 3,
                borderRadius: 3,
              }}
            >
              <QuestionFlow
                onSubmit={handleQuestionComplete}
                onCancel={() => setCitySelected(false)}
              />
            </Box>
          </Modal>
        )}

        {processing && <ProcessingScreen onFinish={handleProcessingDone} />}

        <MapPage
          cityName={cityName}
          citySelected={citySelected}
          onVenueResults={handleVenueResults}
          suggestedPlaceIds={suggestedPlaceIds}
          shouldTriggerSearch={questionDone === false}
        />
      </div>
    </div>
  );
}

export default App;
