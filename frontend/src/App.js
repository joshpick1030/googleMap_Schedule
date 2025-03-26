import React, { useState } from "react";
import MapPage from "./components/MapPage";
import QuestionFlow from "./components/QuestionFlow";
import GoogleLoginButton from "./components/GoogleLoginButton";
import "./App.css";
import { InfoWindow } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

function ProcessingScreen({ onFinish }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // 3s to simulate AI
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="processing-screen">
    <div className="spinner" />
    <h2>Processing your schedule...</h2>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // CITY + PLACES
  const [cityName, setCityName] = useState("");
  const [citySelected, setCitySelected] = useState(false);
  const [allPlaces, setAllPlaces] = useState([]);

  // QUESTIONS + FLOW
  const [questionDone, setQuestionDone] = useState(false);
  const [answers, setAnswers] = useState({});
  const [processing, setProcessing] = useState(false);

  //Add Preload Spinner
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  

  // On app load, restore user if within 10 min
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

  // HANDLE LOGIN
  const handleLoginSuccess = (userData) => {
    setUser(userData);

    // Save login time and user data in localStorage
    const loginData = {
      user: userData,
      timestamp: Date.now()
    };
    localStorage.setItem("eventai_user", JSON.stringify(loginData));
  };

  // WHEN CITY IS FOUND
  const handleCityConfirm = (city) => {
    setCityName(city);
    setCitySelected(true);
  };

  // WHEN MAPPAGE GETS PLACES
  const handleVenueResults = (places) => {
    setLoadingPlaces(true);
    // Save them in state for later filtering
    setAllPlaces(places);
    setTimeout(() => setLoadingPlaces(false), 1000);
  };

  // WHEN QUESTIONS COMPLETE
  const handleQuestionComplete = (userAnswers) => {
    setAnswers(userAnswers);
    setQuestionDone(true);
    setProcessing(true);
  };

  // PROCESSING FINISHED
  const handleProcessingDone = () => {
    setProcessing(false);
  };

  // FILTER + SLICE PLACES BASED ON ANSWERS
  const getFilteredPlaces = () => {
    if (!allPlaces.length) return [];

    // Check if user wants to eat
    const wantsToEat = answers.eat?.toLowerCase() === "yes";

    // Filter
    let filtered = allPlaces.filter((place) => {
      const types = place.types || [];
      if (wantsToEat) {
        // Keep "restaurant", "food", "cafe", etc.
        return (
          types.includes("restaurant") ||
          types.includes("food") ||
          types.includes("cafe") ||
          types.includes("meal_takeaway")
        );
      } else {
        // Keep "bar", "night_club"
        return types.includes("bar") || types.includes("night_club");
      }
    });

    // If filtered is empty but user wants to eat, we can fallback to everything or do nothing
    // For now let's just keep it as is.

    // Spots to visit
    const spots = parseInt(answers.spots || "3", 10);

    // Try to get spots that are open now
    let openNowFiltered = filtered.filter((place) => place.openNow === true);

    // If we don’t have enough open ones, fill in the rest
    if (openNowFiltered.length < spots) {
      const closedOrUnknown = filtered.filter((place) => place.openNow !== true);
      openNowFiltered = [...openNowFiltered, ...closedOrUnknown];
    }

    // Return only the number of spots requested
    return openNowFiltered.slice(0, spots);
  };

  const finalPlaces = getFilteredPlaces();

  return (
    <div className="app-container">
      {user && (
        
        <div className="sidebar">
          
          <h2> Welcome, {user.name}!</h2>
          
          <button
            className = "logout-button"
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
          {citySelected }

          {/* If final itinerary is ready */}
          {questionDone && !processing && (
            <>
              <h3>Your Canada Day Itinerary</h3>

              {/* Show final filtered places */}
              {finalPlaces.map((venue, i) => (
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
                      color: venue.openNow === true ? "green" : venue.openNow === false ? "red" : "gray",
                      fontWeight: "bold",
                      margin: "0.3rem 0"
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
                    <p style={{ fontStyle: "italic", color: "#666", fontSize: "0.85rem" }}>
                      {venue.todayHours}
                    </p>
                  )}

                  {/* 🧭 Directions link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "0.5rem",
                      color: "#007bff",
                      textDecoration: "underline"
                    }}
                  >
                    🧭 Get Directions
                  </a>
                </div>
              ))}
              {/* If no places matched, mention something */}
              {finalPlaces.length === 0 && (
                <p>No matching venues found. Try a bigger city or different answers!</p>
              )}

              <a
                href="https://yourshop.com/shirt"
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: "1rem", textDecoration: "none" }}
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

        {user && !questionDone && (
          <div className="search-bar">
            {!citySelected ? (
              <>
                {/* Type a city + search = zoom in MapPage */}
                <input
                  type="text"
                  placeholder="Enter a city"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                />
                <button onClick={() => handleCityConfirm(cityName)}>Search</button>
              </>
            ) : (
              <QuestionFlow onSubmit={handleQuestionComplete} />
            )}
          </div>
        )}

        {processing && <ProcessingScreen onFinish={handleProcessingDone} />}

        {/* Map always rendered; it will zoom + fetch places once city is typed */}
        <MapPage
          cityName={cityName}
          citySelected={citySelected}
          onVenueResults={handleVenueResults}
        />
      </div>
    </div>
  );
}

export default App;
