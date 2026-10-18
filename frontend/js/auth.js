
function checkLogin() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      const name = user.username || user.name || user.email || 'My Account';

      const logout = confirm(
        `Logged in as ${name}\n\nOK = Logout\nCancel = Stay logged in`
      );

      if (logout) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    } catch (error) {
      console.error('User data error:', error);
      window.location.href = 'login.html';
    }
  } else {
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const userDisplay = document.getElementById('userDisplay');

  if (userDisplay) {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        userDisplay.textContent =
          user.username || user.name || 'My Account';
      } catch (error) {
        userDisplay.textContent = 'Login';
      }
    } else {
      userDisplay.textContent = 'Login';
    }
  }
});

/* SHOW ADMIN PANEL FOR ADMIN USERS ONLY */
document.addEventListener('DOMContentLoaded', async () => {
  const adminLink = document.getElementById('adminPanelLink');
  const token = localStorage.getItem('token');

  if (!adminLink || !token) return;

  try {
    const response = await fetch('https://animedekhobd.onrender.com/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const user = await response.json();

    if (user.role === 'admin') {
      adminLink.hidden = false;
    }
  } catch (error) {
    console.error('Admin role check failed:', error);
  }
});

