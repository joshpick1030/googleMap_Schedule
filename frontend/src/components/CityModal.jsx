import React from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton
} from "@mui/material";
import LocationCityIcon from "@mui/icons-material/LocationCity";

function CityModal({
  open,
  minimized,
  cityName,
  onChange,
  onConfirm,
  onLater,
  onMaximize
}) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      disableEnforceFocus
      disableAutoFocus
      disableEscapeKeyDown
      hideBackdrop
      style={{ pointerEvents: "none" }}
    >
      <Box
        sx={{
          position: "absolute",
          top: minimized ? 20 : "50%",
          left: minimized ? "auto" : "50%",
          transform: minimized ? "none" : "translate(-50%, -50%)",
          right: minimized ? 20 : "auto",
          width: minimized ? "auto" : "90%",
          maxWidth: minimized ? "auto" : 400,
          bgcolor: minimized ? "transparent" : "white",
          boxShadow: minimized ? "none" : 24,
          p: minimized ? 0 : 3,
          borderRadius: 2,
          pointerEvents: "auto",
          zIndex: 1300
        }}
      >
        {!minimized ? (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2, textAlign: "center"}}>
              Select Your City
            </Typography>
            <TextField
              fullWidth
              label="Enter a city"
              variant="outlined"
              value={cityName}
              onChange={(e) => onChange(e.target.value)}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={onLater}
              >
                Later
              </Button>
              <Button variant="contained" color="primary" onClick={onConfirm}>
                Confirm
              </Button>
            </Box>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LocationCityIcon />}
            onClick={onMaximize}
            sx={{
              borderRadius: 5,
              px: 2.5,
              py: 1,
              top: 50,
              right: -5,
              fontSize: "0.9rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
              textTransform: "none",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "1rem",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            Enter City
          </Button>
        )}
      </Box>
    </Modal>
  );
}

export default CityModal;
