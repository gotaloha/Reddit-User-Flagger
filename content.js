// Create the button
function createToggleButton(username, savedUsers) {
  const button = document.createElement('button');
    button.title = 'Flag user';

  updateButtonIcon(button, username, savedUsers);

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleUsername(username, button);
  });

  return button;
}

// Update button icon depending on saved status
function updateButtonIcon(button, username, savedUsers) {
  if (savedUsers.includes(username)) {
    button.innerText = '☉';
    button.title = 'Remove user';
  } else {
    button.innerText = '⚑';
    button.title = 'Flag user';
  }
}

// Save or remove username
function toggleUsername(username, button) {
  chrome.storage.local.get(['savedUsers'], (result) => {
    let savedUsers = result.savedUsers || [];

    if (savedUsers.includes(username)) {
      savedUsers = savedUsers.filter(user => user !== username); // Remove username
    } else {
      savedUsers.push(username); // Add username
    }

    chrome.storage.local.set({ savedUsers }, () => {
      updateButtonIcon(button, username, savedUsers);
      injectCustomCSS(savedUsers);

      updateButtonIcon(button, username, savedUsers);
      button.classList.add('animate');
      setTimeout(() => button.classList.remove('animate'), 300);
      injectCustomCSS(savedUsers);
    });
  });
}

// Inject custom CSS for highlighting saved users
function injectCustomCSS(usernames) {
  let styleTag = document.getElementById('reddit-user-highlighter');

  if (styleTag) {
    styleTag.remove();
  }

  styleTag = document.createElement('style');
  styleTag.id = 'reddit-user-highlighter';

  const cssRules = usernames.map(name => 
    `shreddit-comment[author="${name}"] { border: 2px solid #ff0000; background-color: #ff000018; }`
  ).join('\n');

  styleTag.textContent = cssRules;
  document.head.appendChild(styleTag);
}

// Scan Reddit Comments page and inject buttons next to each user name
function addButtons() {
  chrome.storage.local.get(['savedUsers'], (result) => {
    const savedUsers = result.savedUsers || [];
    const commentAuthors = document.querySelectorAll('shreddit-comment');

    commentAuthors.forEach(comment => {
      const username = comment.getAttribute('author');

      if (username && !comment.querySelector('.asshole-button')) {
        const header = comment.querySelector('faceplate-tracker a');

        if (header) {
          const button = createToggleButton(username, savedUsers);

          button.classList.add('asshole-button');
          header.parentElement.appendChild(button);
        }
      }
    });
  });
}

// Load saved users and apply highlighting
chrome.storage.local.get(['savedUsers'], (result) => {
  const savedUsers = result.savedUsers || [];
  injectCustomCSS(savedUsers);
});

// Execute immediately, and monitor for dynamic page changes
addButtons();

const observer = new MutationObserver(addButtons);

observer.observe(document.body, { childList: true, subtree: true });
