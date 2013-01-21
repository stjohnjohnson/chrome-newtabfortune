// Available collections
var available = [
  'art','ascii-art','calvin','chalkboard','chucknorris','computers',
  'cookie','debian','definitions','discworld','drugs','education',
  'ethnic','familyguy','fgump','firefly','food','fortunes','futurama',
  'goedel','hitchhiker','homer','humorists',
  'kids','knghtbrd','law','linux','linuxcookie','literature','love',
  'magic','medicine','men-women','miscellaneous','news','paradoxum',
  'people','perl','pets','platitudes','politics','riddles','science',
  'songs-poems','sports','startrek','starwars','translate-me','wisdom',
  'work','xfiles','zippy'
];
var collections = {};

// On load, init
window.addEventListener('load', init, false);
document.querySelector('#toggle').addEventListener('click', restoreOptions);
document.querySelector('#save').addEventListener('click', saveOptions);
document.querySelector('#fortune').addEventListener('click', newFortune, false);

// Pick a random key from an object
function fetchRandomKey(object) {
  var key, keys = [];
  for (key in object) {
    if(object.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return fetchRandomArray(keys);
}

// Pick a random entry from an array
function fetchRandomArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Saves options to localStorage.
function saveOptions() {
  for (i in available) {
    var fortune = available[i];
    var item = document.querySelector("#fortune_" + fortune);
    localStorage[fortune] = item.checked;
  }
  reloadFortunes();
  document.querySelector('#options').style.display = 'none';
  document.querySelector('#toggle').style.display = 'block';
}

// Restores select box state to saved value from localStorage.
function restoreOptions() {
  var i,fortune,item;
  for (i in available) {
    fortune = available[i];
    item = document.querySelector("#fortune_" + fortune);
    item.checked = (localStorage[fortune] === 'true');
  }
  document.querySelector('#options').style.display = 'block';
  document.querySelector('#toggle').style.display = 'none';
}

// Generate new fortune message
function newFortune() {
  var collection,fortune;

  do {
    // Pick random fortune collection and fortune
    collection = fetchRandomKey(collections);
    fortune = fetchRandomArray(collections[collection]);
    // Trim whitespace
    fortune = fortune.replace(/^\n*/, '').replace(/\s\s*$/, '');
  } while (fortune === '');

  // Display
  document.querySelector('#fortune').innerText = fortune;
  document.querySelector('#source').innerText = collection;
}

// Load a fortune file
function loadFortune(file) {
  var fileURL = chrome.extension.getURL("fortunes/" + file);
  var xmlreq = new XMLHttpRequest();
  xmlreq.open("GET", fileURL, false);
  xmlreq.send();

  // Store fortune collections
  collections[file] = xmlreq.responseText.split("\n%");
}

// Load all selected fortune files
function reloadFortunes() {
  var i,fortune,
      count = 0;
  // Clear collections
  collections = {};
  // Load selected fortunes
  for (i in available) {
    fortune = available[i];
    if (localStorage[fortune] === 'true') {
      loadFortune(fortune);
      count++;
    }
  }
  // If none are selected, load all
  if (count === 0) {
    for (i in available) {
      fortune = available[i];
      localStorage[fortune] = 'true';
      loadFortune(fortune);
    }
  }
  // Generate new fortune
  newFortune();
}

// Initialize and load fortune files
function init() {
  // Make options
  for (i in available) {
    var fortune = available[i];
    var id = "fortune_" + fortune;
    document.querySelector('#fortunes').innerHTML +=
      '<div><label for="' + id + '">' + fortune + ':</label> ' +
      '<input type="checkbox" id="' + id + '" value="1" /></div>';
  }
  // Load new fortunes
  reloadFortunes();
}
