import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

function GoogleLoginButton({ onSuccess }) {
    const handleSuccess = (credentialResponse) => {
      const token = credentialResponse.credential;
  
      fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (onSuccess) onSuccess(data.user);
        })
        .catch((err) => {
          console.error("Login error", err);
          alert("Login failed");
        });
    };
  
    return (
      <GoogleOAuthProvider clientId="1044849120169-m2vcm6djve6ki4up1nmvpoj6hs7hki1f.apps.googleusercontent.com">
        <GoogleLogin onSuccess={handleSuccess} onError={() => console.log("Login Failed")} />
      </GoogleOAuthProvider>
    );
}

export default GoogleLoginButton;
