const tokenInput = document.getElementById("token");
const status = document.getElementById("status");
const music = document.getElementById("music");
const player = document.getElementById("player");

function setConnected(connected) {
  music.hidden = !connected;
  status.textContent = connected
    ? "Token saved locally. FabTune verification is not configured yet."
    : "No token connected.";
}

document.getElementById("toggle").onclick = () => {
  tokenInput.type =
    tokenInput.type === "password" ? "text" : "password";
};

document.getElementById("login").onclick = () => {
  const token = tokenInput.value.trim();

  if (!token) {
    status.textContent = "Please enter your token.";
    return;
  }

  try {
    localStorage.setItem("timo_fabtune_token", token);
  } catch (error) {
    status.textContent = "Could not save token in this browser.";
    return;
  }

  setConnected(true);
};

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("timo_fabtune_token");
  tokenInput.value = "";
  player.pause();
  player.removeAttribute("src");
  player.load();
  document.getElementById("results").replaceChildren();
  setConnected(false);
};

document.getElementById("searchForm").onsubmit = (event) => {
  event.preventDefault();

  if (!localStorage.getItem("timo_fabtune_token")) {
    setConnected(false);
    return;
  }

  document.getElementById("message").textContent =
    "FabTune API is not connected yet. Search and playback require its API endpoint and response format.";
};

const savedToken = localStorage.getItem("timo_fabtune_token");

if (savedToken) {
  tokenInput.value = savedToken;
  setConnected(true);
} else {
  setConnected(false);
}
