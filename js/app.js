const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

const tokenInput = document.getElementById("token");
const tokenStatus = document.getElementById("tokenStatus");
const googleFallback = document.getElementById("googleFallback");
const googleStatus = document.getElementById("googleStatus");
const music = document.getElementById("music");

// FabTune's official validation API is not known yet.
// Until it is configured, we cannot verify any token.
async function validateFabTuneToken(token) {
  if (!token) return false;

  // TODO: call FabTune's supported API here.
  return false;
}

document.getElementById("tokenLogin").addEventListener("click", async () => {
  const token = tokenInput.value.trim();

  if (!token) {
    tokenStatus.textContent = "Please enter a token.";
    googleFallback.hidden = false;
    initializeGoogleLogin();
    return;
  }

  tokenStatus.textContent = "Checking token…";

  try {
    const valid = await validateFabTuneToken(token);

    if (valid) {
      showMusic("FabTune");
    } else {
      tokenStatus.textContent =
        "Token could not be verified. Try Google Login.";
      googleFallback.hidden = false;
      initializeGoogleLogin();
    }
  } catch (error) {
    tokenStatus.textContent =
      "Token connection failed. Try Google Login.";
    googleFallback.hidden = false;
    initializeGoogleLogin();
  }
});

let googleInitialized = false;

function initializeGoogleLogin() {
  if (googleInitialized) return;

  if (!window.google?.accounts?.id) {
    googleStatus.textContent =
      "Google sign-in is loading. Please wait and try again.";
    return;
  }

  if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    googleStatus.textContent =
      "Setup required: add your Google OAuth Client ID in js/app.js.";
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("googleButton"),
    {
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "rectangular"
    }
  );

  googleInitialized = true;
}

function handleGoogleResponse(response) {
  if (!response.credential) {
    googleStatus.textContent = "Google sign-in failed.";
    return;
  }

  // The credential must be verified on a trusted backend
  // before treating the user as authenticated.
  googleStatus.textContent =
    "Google credential received. Server verification must be configured.";

  // Demo UI only: do not grant protected music access yet.
}

function showMusic(method) {
  music.hidden = false;
  document.getElementById("accessStatus").textContent =
    "Connected using " + method + ".";
}

document.getElementById("logout").addEventListener("click", () => {
  music.hidden = true;
  tokenInput.value = "";
  googleStatus.textContent = "";
  tokenStatus.textContent = "Signed out.";
  googleFallback.hidden = true;
});
