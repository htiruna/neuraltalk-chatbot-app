(function () {
  function toggleChatbox() {
    var chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('open');
    var chatboxButton = document.getElementById('chatbox-button');
    chatboxButton.classList.toggle('closed');
    chatboxButton.classList.toggle('open');
  }

  document
    .getElementById('chatbox-button')
    .addEventListener('click', toggleChatbox);
})();
