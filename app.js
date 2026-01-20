const gallery = document.getElementById("gallery");
const viewer = document.getElementById("viewer");
const searchInput = document.getElementById("search");
const bouton1 = document.getElementById("bouton1");

let currentPath = "items/";
let stack = [];
let items = [];

async function scanFolder(path) {
  const res = await fetch(path);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  const links = Array.from(doc.querySelectorAll("a"))
    .map(a => a.getAttribute("href"))
    .filter(h => h !== "../");

  const files = [];
  const folders = [];

  links.forEach(link => {
    if (link.endsWith("/")) folders.push(link);
    else files.push(link);
  });

  const map = {};
  files.forEach(file => {
    const base = file.replace(/\.(png|jpg|jpeg|txt)$/i, "");
    const ext = file.split(".").pop().toLowerCase();
    map[base] ??= {};
    map[base][ext] = file;
  });

  const itemList = [];
  for (const name in map) {
    if (map[name].png && map[name].txt) {
      itemList.push({
        type: "item",
        name,
        img: path + map[name].png,
        txt: path + map[name].txt
      });
    }
  }

  const folderList = folders.map(f => ({
    type: "folder",
    name: f.replace(/\/$/, ""),
    path: path + f
  }));

  return folderList.concat(itemList);
}

async function load(path) {
  stack.push(currentPath);
  currentPath = path;
  items = await scanFolder(path);
  render();
}

function render() {
  gallery.innerHTML = "";

  items
    .filter(e => e.name.toLowerCase().includes(searchInput.value.toLowerCase()))
    .forEach(e => {
      const div = document.createElement("div");
      div.className = "item";

      if (e.type === "folder") {
        div.innerHTML = `<div style="font-size:3rem">📁</div><div class="name">${e.name}</div>`;
        div.onclick = () => load(e.path);
      } else {
        const img = document.createElement("img");
        img.src = e.img;

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = e.name;

        div.append(img, name);
        div.onclick = () => openItem(e);
      }

      gallery.appendChild(div);
    });
}

async function openItem(e) {
  viewer.innerHTML = "";

  const img = document.createElement("img");
  img.src = e.img;

  const txt = await fetch(e.txt).then(r => r.text());
  const pre = document.createElement("pre");
  pre.textContent = txt;

  viewer.append(img, pre);
}

bouton1.onclick = async () => {
  if (stack.length === 0) return;
  currentPath = stack.pop();
  items = await scanFolder(currentPath);
  render();
};

searchInput.addEventListener("input", render);

scanFolder(currentPath).then(list => {
  items = list;
  render();
});
