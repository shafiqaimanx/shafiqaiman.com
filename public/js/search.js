const searchInput = document.querySelector("#search-query");
const searchResults = document.querySelector("#search-results");

searchInput.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  searchResults.innerHTML = "";

  if (query.length < 3) return;

  fetch("/index.json")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query)) {
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.href = item.permalink;
          link.textContent = item.title;
          li.appendChild(link);
          searchResults.appendChild(li);
        }
      });
    });
});
