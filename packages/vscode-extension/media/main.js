(function () {
  const vscode = acquireVsCodeApi();

  // Login page handlers
  const loginBtn = document.getElementById("login-btn");
  const loginStatus = document.getElementById("login-status");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      loginBtn.disabled = true;
      loginBtn.textContent = "Opening browser...";
      vscode.postMessage({ type: "login" });
    });
  }

  // Authenticated page handlers
  const refreshBtn = document.getElementById("refresh-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loadingDiv = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const bountiesContainer = document.getElementById("bounties-container");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "fetchBounties", params: {} });
      if (loadingDiv) loadingDiv.style.display = "flex";
      if (bountiesContainer) bountiesContainer.innerHTML = "";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "logout" });
    });
  }

  // Handle messages from extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "loginStarted":
        if (loginStatus) {
          loginStatus.style.display = "block";
          loginStatus.textContent = "Waiting for authorization in browser...";
          loginStatus.className = "text-secondary";
        }
        break;

      case "loginError":
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Connect to bounty.new";
        }
        if (loginStatus) {
          loginStatus.style.display = "block";
          loginStatus.textContent = message.message || "Login failed";
          loginStatus.className = "text-error";
          loginStatus.style.color = "#ef4444";
        }
        break;

      case "bountiesLoaded":
        if (loadingDiv) loadingDiv.style.display = "none";
        displayBounties(message.bounties);
        break;

      case "error":
        if (loadingDiv) loadingDiv.style.display = "none";
        showError(message.message || "An error occurred");
        break;
    }
  });

  function showError(message) {
    if (errorDiv) {
      errorDiv.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-title">Error Loading Bounties</div>
        <div class="error-message">${escapeHtml(message)}</div>
      `;
      errorDiv.style.display = "flex";
    }
    if (bountiesContainer) {
      bountiesContainer.innerHTML = "";
    }
  }

  function formatCurrency(amount) {
    if (!amount || amount === 0) return "N/A";
    return `$${amount.toLocaleString()}`;
  }

  function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  }

  function formatStatus(status) {
    return status.replace(/_/g, " ");
  }

  function displayBounties(bounties) {
    if (!bountiesContainer) return;

    if (!bounties || bounties.length === 0) {
      bountiesContainer.innerHTML = `
        <div class="empty-container">
          <div class="empty-icon">🎯</div>
          <div class="empty-title">No Bounties Found</div>
          <div class="empty-message">
            Check back later for new bounties or create one on bounty.new
          </div>
        </div>
      `;
      return;
    }

    const bountiesHtml = bounties
      .map((bounty, index) => {
        const amount = formatCurrency(bounty.amount);
        const creator = bounty.creator?.name || "Unknown";
        const creatorInitial = creator.charAt(0).toUpperCase();
        const creatorImage = bounty.creator?.image || "";
        const status = bounty.status || "open";
        const description = bounty.description || "";
        const timeAgo = formatTimeAgo(bounty.createdAt);

        return `
          <div class="bounty-card slide-in" style="animation-delay: ${index * 50}ms" data-id="${escapeHtml(bounty.id)}">
            <div class="bounty-card-header">
              <div class="bounty-card-creator">
                <div class="avatar">
                  ${creatorImage ? `<img src="${escapeHtml(creatorImage)}" alt="${escapeHtml(creator)}" />` : creatorInitial}
                </div>
                <div class="creator-info">
                  <div class="creator-name-row">
                    <span class="creator-name">${escapeHtml(creator)}</span>
                    <div class="verified-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span class="bounty-status-text">${escapeHtml(formatStatus(status))}</span>
                </div>
              </div>
              <div class="bounty-card-meta">
                <span class="bounty-amount">${amount}</span>
              </div>
            </div>
            
            <div class="bounty-card-content">
              <h3 class="bounty-title">${escapeHtml(bounty.title)}</h3>
              ${description ? `<p class="bounty-description">${escapeHtml(description)}</p>` : ""}
            </div>
            
            <div class="bounty-card-footer">
              <div class="bounty-footer-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${timeAgo}</span>
              </div>
              <div class="status-badge status-${status}">${escapeHtml(formatStatus(status))}</div>
            </div>
          </div>
        `;
      })
      .join("");

    bountiesContainer.innerHTML = `<div class="bounties-list">${bountiesHtml}</div>`;

    // Add click handlers
    document.querySelectorAll(".bounty-card").forEach((card) => {
      card.addEventListener("click", () => {
        const bountyId = card.getAttribute("data-id");
        vscode.postMessage({
          type: "openBounty",
          bountyId: bountyId,
        });
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }
})();
