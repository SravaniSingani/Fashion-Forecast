const iconsBtn = document.querySelector(".icons");

//console.log("hello");
const navItems = document.getElementById("dropnav");

iconsBtn.addEventListener("click", () => {
    navItems.classList.toggle("visibility");
    console.log("clicked");
})