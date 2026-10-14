(() => {
  "use strict";

  const PLAYLIST_ID =
    window.PLAYLIST_ID || "PLYb2yfXnHh-KBATeJ6NS5u_eSt8zBHdj1";

  const $ = (selector) => document.querySelector(selector);

  const player = $("#yt-player");
  const apiInput = $("#api-key");
  const searchInput = $("#search-input");
  const trackList = $("#track-list");
  const status = $("#list-status");
  const count = $("#track-count");
  const loadButton = $("#load-list");
  const loadMoreButton = $("#load-more");
  const loadMoreWrap = $("#load-more-wrap");
  const themeButton = $("#toggle-theme");
  const currentTitle = $("#current-title");
  const currentArtist = $("#current-artist");

  let tracks = [];
  let nextPageToken = "";
  let loading = false;
  let requestNumber = 0;

  const videoIds = new Set();

  function setStatus(message) {
    status.textContent = message;
  }

  function setLoading(value) {
    loading = value;
    loadButton.disabled = value;
    loadMoreButton.disabled = value;
    loadButton.textContent = value ? "Loading..." : "↻ Load songs";
    loadMoreButton.textContent = value ? "Loading..." : "Load more songs";
  }

  function safeImage(videoId, thumbnails = {}) {
    const image =
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;

    // Accept only HTTPS thumbnail URLs.
    try {
      const url = new URL(image);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  async function fetchPage(append = false) {
    const apiKey = apiInput.value.trim();

    if (!apiKey) {
      setStatus("Please enter a YouTube Data API v3 key to load song details.");
      $("#api-settings").open = true;
      apiInput.focus();
      return;
    }

    if (loading) return;

    const thisRequest = ++requestNumber;
    setLoading(true);

    if (!append) {
      tracks = [];
      videoIds.clear();
      nextPageToken = "";
      trackList.replaceChildren();
      count.textContent = "0";
      loadMoreWrap.hidden = true;
      setStatus("Fetching playlist details...");
    }

    try {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        maxResults: "50",
        playlistId: PLAYLIST_ID,
        key: apiKey
      });

      if (append && nextPageToken) {
        params.set("pageToken", nextPageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message ||
          `YouTube API request failed (${response.status}).`
        );
      }

      // Ignore stale responses.
      if (thisRequest !== requestNumber) return;

      const newTracks = (data.items || [])
        .map((item) => {
          const snippet = item.snippet || {};
          const videoId =
            snippet.resourceId?.videoId ||
            item.contentDetails?.videoId;

          if (!videoId || videoIds.has(videoId)) return null;

          videoIds.add(videoId);

          return {
            id: videoId,
            title: snippet.title || "Untitled track",
            artist: snippet.videoOwnerChannelTitle ||
                    snippet.channelTitle || "YouTube",
            thumbnails: snippet.thumbnails || {},
            position: snippet.position ?? tracks.length,
            unavailable:
              snippet.title === "Private video" ||
              snippet.title === "Deleted video"
          };
        })
        .filter(Boolean);

      tracks = append ? tracks.concat(newTracks) : newTracks;
      nextPageToken = data.nextPageToken || "";

      renderTracks();

      if (!tracks.length) {
        setStatus("No tracks found. Check your playlist ID and permissions.");
      } else {
        setStatus(
          `Loaded ${tracks.length} tracks` +
          (nextPageToken ? ". More songs are available." : ". Playlist loaded.")
        );
      }

      loadMoreWrap.hidden = !nextPageToken;
    } catch (error) {
      if (thisRequest !== requestNumber) return;

      console.error("Playlist error:", error);
      setStatus(
        `Could not load songs: ${error.message}. ` +
        "Check your API key, quota, network and playlist ID."
      );
    } finally {
      if (thisRequest === requestNumber) setLoading(false);
    }
  }

  function createTrackCard(track, index) {
    const card = document.createElement("article");
    card.className = "track-card";

    const play = document.createElement("button");
    play.className = "track-play";
    play.type = "button";
    play.setAttribute("aria-label", `Play ${track.title}`);

    const thumb = document.createElement("span");
    thumb.className = "track-thumb";

    const image = document.createElement("img");
    image.src = safeImage(track.id, track.thumbnails);
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "strict-origin-when-cross-origin";
    image.addEventListener("error", () => {
      image.style.visibility = "hidden";
    }, { once: true });

    const overlay = document.createElement("span");
    overlay.className = "play-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.textContent = "▶";

    thumb.append(image, overlay);

    const info = document.createElement("span");
    info.className = "track-info";

    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const text = document.createElement("span");
    text.className = "track-text";

    const title = document.createElement("strong");
    title.textContent = track.title;

    const artist = document.createElement("span");
    artist.textContent = track.artist;

    text.append(title, artist);
    info.append(number, text);
    play.append(thumb, info);
    card.append(play);

    play.addEventListener("click", () => playTrack(track));

    return card;
  }

  function renderTracks() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = tracks.filter((track) =>
      `${track.title} ${track.artist}`.toLowerCase().includes(query)
    );

    count.textContent = String(filtered.length);
    trackList.replaceChildren();

    if (!filtered.length && tracks.length) {
      setStatus("No songs match your search.");
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((track, index) => {
      fragment.append(createTrackCard(track, index));
    });

    trackList.append(fragment);
  }

  function playTrack(track) {
    if (track.unavailable) {
      setStatus("This video may no longer be available on YouTube.");
      return;
    }

    const videoId = encodeURIComponent(track.id);
    const playlistId = encodeURIComponent(PLAYLIST_ID);

    player.src =
      `https://www.youtube.com/embed/${videoId}` +
      `?list=${playlistId}&autoplay=1&rel=0`;

    currentTitle.textContent = track.title;
    currentArtist.textContent = track.artist;

    $("#player").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // Theme preference
  try {
    if (localStorage.getItem("timo-theme") === "light") {
      document.body.classList.replace("dark", "light");
    }
  } catch {
    // Theme still works if storage is unavailable.
  }

  themeButton.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");

    document.body.classList.toggle("dark", !isLight);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isLight ? "#f5f4fa" : "#09090f");

    try {
      localStorage.setItem("timo-theme", isLight ? "light" : "dark");
    } catch {
      // Ignore unavailable storage.
    }
  });

  loadButton.addEventListener("click", () => fetchPage(false));

  loadMoreButton.addEventListener("click", () => {
    if (nextPageToken) fetchPage(true);
  });

  searchInput.addEventListener("input", renderTracks);

  // Press "/" to focus search without scrolling the page.
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable;

    if (event.key === "/" && !typing) {
      event.preventDefault();
      searchInput.focus({ preventScroll: true });
    }

    if (event.key === "Escape" && target === searchInput) {
      searchInput.value = "";
      renderTracks();
      searchInput.blur();
    }
  });
})();
