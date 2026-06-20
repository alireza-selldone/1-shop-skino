export function renderUserMenu({
  state,
  els,
  escapeHtml,
  firstNonNull,
  userDisplayName,
  userInitials,
  resolveUserAvatarUrl,
  buildAccountLogoutUrl,
}) {
  if (!els.accountMenu) return;
  const user = state.sessionUser || {};
  const name = userDisplayName(user);
  if (!state.sessionAuthenticated) {
    els.accountMenu.innerHTML = `
      <div class="account-menu-user">
        <div class="account-menu-avatar" aria-hidden="true">?</div>
        <div class="account-menu-meta">
          <strong>Guest</strong>
          <p>Log in to see your profile</p>
        </div>
      </div>
      <div class="account-menu-links">
        <button class="black-button account-menu-login" type="button" data-account-menu-login>Log in</button>
      </div>
    `;
    return;
  }

  const avatar = resolveUserAvatarUrl(user, "big");
  const contact = firstNonNull(user?.email, user?.phone, user?.username, "");
  els.accountMenu.innerHTML = `
    <div class="account-menu-user">
      <div class="account-menu-avatar" aria-hidden="true">
        ${
          avatar
            ? `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(name || "Profile")} avatar" />`
            : `<span>${escapeHtml(userInitials(user))}</span>`
        }
      </div>
      <div class="account-menu-meta">
        <strong>${escapeHtml(name || "Selldone user")}</strong>
        ${contact ? `<p>${escapeHtml(contact)}</p>` : ""}
      </div>
    </div>
    <div class="account-menu-links">
      <button class="account-menu-link" type="button" data-account-menu-cart>
        <span><b class="account-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 8h10l1.2 12H5.8L7 8ZM9 8a3 3 0 0 1 6 0" /></svg></b> Current bag</span>
        <small>Review active Selldone cart</small>
      </button>
      <a class="account-menu-link" href="#account/orders" data-account-menu-orders>
        <span><b class="account-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10" /></svg></b> Order history</span>
        <small>View your previous purchases</small>
      </a>
      <a class="account-menu-link" href="#account/profile" data-account-menu-profile>
        <span><b class="account-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg></b> Profile</span>
        <small>Account and contact details</small>
      </a>
      <a class="account-menu-logout" href="${buildAccountLogoutUrl()}"><b class="account-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15 17l5-5-5-5M20 12H9M11 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" /></svg></b> Log out</a>
    </div>
  `;
}