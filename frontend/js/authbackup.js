
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
