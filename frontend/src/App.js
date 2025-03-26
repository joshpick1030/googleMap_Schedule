import React, { useState } from "react";
import MapPage from "./components/MapPage";
import QuestionFlow from "./components/QuestionFlow";
import GoogleLoginButton from "./components/GoogleLoginButton";
import "./App.css";
import { InfoWindow } from "@react-google-maps/api";

function ProcessingScreen({ onFinish }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // 3s to simulate AI
    return () => clearTimeout(timer);
  }, [onFinish]);

  return <h2 style={{ padding: "1rem" }}>Processing your schedule... 🤖✨</h2>;
}

function App() {
  const [user, setUser] = useState(null);

  // CITY + PLACES
  const [cityName, setCityName] = useState("");
  const [citySelected, setCitySelected] = useState(false);
  const [allPlaces, setAllPlaces] = useState([]);

  // QUESTIONS + FLOW
  const [questionDone, setQuestionDone] = useState(false);
  const [answers, setAnswers] = useState({});
  const [processing, setProcessing] = useState(false);

  // HANDLE LOGIN
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // WHEN CITY IS FOUND
  const handleCityConfirm = (city) => {
    setCityName(city);
    setCitySelected(true);
  };

  // WHEN MAPPAGE GETS PLACES
  const handleVenueResults = (places) => {
    // Save them in state for later filtering
    setAllPlaces(places);
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
    return filtered.slice(0, spots);
  };

  const finalPlaces = getFilteredPlaces();

  return (
    <div className="app-container">
      {user && (
        <div className="sidebar">
          <h2>👋 Welcome, {user.name}!</h2>
          {citySelected ? <p>City: {cityName}</p> : <p>Enter a city to begin!</p>}

          {/* If final itinerary is ready */}
          {questionDone && !processing && (
            <>
              <h3>Your Canada Day Itinerary</h3>

              {/* Show final filtered places */}
              {finalPlaces.map((venue, i) => (
                <div className="venue" key={i}>
                  <h4>{venue.name}</h4>
                  <p>{venue.vicinity || venue.formatted_address}</p>
                  <p>⭐ {venue.rating || "N/A"}</p>
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
