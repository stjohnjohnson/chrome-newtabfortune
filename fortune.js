// Available collections
var available_core = [
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
var available_custom = [];
var available = [];
var collections = {};
var hasGenerated = false;


// Pick a random key from an object
function fetchRandomKey(object) {
  return fetchRandomArray(Object.keys(object));
}

// Pick a random entry from an array
function fetchRandomArray(array) {
  if (!array || array.length === 0) {
    return '';
  }
  return array[Math.floor(Math.random() * array.length)];
}

// Saves options to localStorage.
function saveOptions() {
  var i,item,selected = {};

  // Load selected fortunes
  for (i in available) {
    item = document.querySelector("#fortune_" + available[i]);
    selected[available[i]] = item.checked;
  }

  // Update settings
  chrome.storage.sync.set({
    'selected': selected,
    'theme': document.querySelector('input[name="theme"]:checked').value,
  }, function() {
    reloadFortunes();
    reloadTheme();
  });
}

// Restores select box state to saved value from localStorage.
function restoreOptions() {
  chrome.storage.sync.get(['selected', 'theme'], function(storage) {
    var i,fortune,item;

    // Create selected list if not exist
    if (!storage.selected) {
      storage.selected = {};
    }
    // Set default theme if not selected
    if (!storage.theme) {
      storage.theme = "light";
    }

    // Load selected fortunes
    for (i in available) {
      item = document.querySelector("#fortune_" + available[i]);
      item.checked = (storage.selected[available[i]] === true);
    }

    document.querySelector("#theme_" + storage.theme).checked = true;
  });
}

// Generate new fortune message
function generateFortune() {
  var collection,fortune,i,
      output = '',
      limit = 0;

  hasGenerated = true;
  do {
    // Pick random fortune collection and fortune
    collection = fetchRandomKey(collections);
    fortune = fetchRandomArray(collections[collection]);
    // Trim whitespace
    fortune = fortune.replace(/^\n*/, '').replace(/\s\s*$/, '');

    // Fix messages longer than 80 characters
    for (i in fortune) {
      limit++;
      output += fortune[i];
      if (fortune[i] === "\n") {
        limit = 0;
      } else if (limit > 80) {
        output += "\n";
        limit = 0;
      }
    }
    fortune = output;
  } while (fortune === '');

  // Display
  document.querySelector('#fortune').innerText = fortune;
  document.querySelector('#source').innerText = collection;
}

// Load a fortune file
async function loadFortune(file) {
  var fileURL,xmlreq,fortunes;

  return new Promise(function (resolve, reject) {
    // Load from file
    if (available_core.indexOf(file) !== -1) {
      fileURL = chrome.extension.getURL("fortunes/" + file);
      xmlreq = new XMLHttpRequest();
      xmlreq.addEventListener("load", function() {
        // Store fortune collections
        collections[file] = xmlreq.responseText.split("\n%");
        resolve();
      });
      xmlreq.open("GET", fileURL);
      xmlreq.send();
    } else {
      fileURL = 'custom_' + file;
      // Load from local storage
      chrome.storage.sync.get([fileURL], function(storage) {
        // Store fortune collections
        if (storage[fileURL]) {
          collections[file] = storage[fileURL].split("\n%");
        }
        resolve();
      });
    }
  });
}

// Load all selected fortune files
function reloadFortunes() {
  var i, count = 0;
  // Clear collections
  collections = {};
  hasGenerated = false;
  chrome.storage.sync.get(['selected'], function (storage) {
    // Create selected list if not exist
    if (!storage.selected) {
      storage.selected = {};
    }

    loadFuncs = [];

    // Load selected fortunes
    for (i in available) {
      if (storage.selected[available[i]] === true) {
        loadFuncs.push(loadFortune(available[i]));
        count++;
      }
    }

    // If none are selected, load all
    if (count === 0) {
      for (i in available) {
        storage.selected[available[i]] = true;
        loadFuncs.push(loadFortune(available[i]));
      }

      // Update settings
      chrome.storage.sync.set({ 'selected': storage.selected });
    }

    Promise.all(loadFuncs).then(function () {
      // Generate new fortune
      generateFortune();
    });
  });
}

// Reload the selected theme
function reloadTheme() {
   chrome.storage.sync.get(['theme'], function (storage) {
    // Use default theme if not found
    if (!storage.theme) {
      storage.theme = "light";
    }

    document.querySelector('html').className = 'theme-' + storage.theme;
  });
}

// Get available items
function getAvailable() {
  available = available_core;
  chrome.storage.sync.get(['collections'], function(storage) {
    // Create collection list
    if (!storage.collections) {
      storage.collections = {};
    }
    available_custom = Object.keys(storage.collections);
    available = available.concat(available_custom);

    // Create html entries
    var html = '',fortune,id,i;
    for (i in available_core) {
      fortune = available_core[i];
      id = "fortune_" + fortune;
      html += '<div><label for="' + id + '">' + fortune + ':</label> ' +
              '<input type="checkbox" id="' + id + '" value="1" /></div>';
    }
    for (i in available_custom) {
      fortune = available_custom[i];
      id = "fortune_" + fortune;
      html += '<div><label for="' + id + '">' + fortune + ':</label><span id="remove_' + fortune + '">?</span> ' +
              '<input type="checkbox" id="' + id + '" value="1" /></div>';

    }
    document.querySelector('#fortunes').innerHTML = html;
    for (i in available_custom) {
      fortune = available_custom[i];
      id = "remove_" + fortune;
      document.querySelector('#' + id).addEventListener('click', function(e) {
        var name, id = e.target.id.split('_');
        id.shift();
        name = id.join('_');
        chrome.storage.sync.get(['custom_' + name], function(storage) {
          // Ensure content is there
          if (!storage['custom_' + name]) {
            storage['custom_' + name] = '';
          }
          document.querySelector('#new_name').value = name;
          document.querySelector('#new_name').readonly = 'readonly';
          document.querySelector('#new_content').value = storage['custom_' + name];
          document.querySelector('#new').style.display = 'block';
        });
      });
    }

    // Set settings
    restoreOptions();
    // Display Theme
    reloadTheme();
    // Reload
    reloadFortunes();
  });
}

// Create a new Collection Item
function newCollection(name, content) {
  if (!name || !content) {
    alert('Name and Content are required');
    return;
  }
  if (!name.match(/^[\da-zA-Z_]*$/)) {
    alert('Name can only have letters, numbers, and underscores');
    return;
  }
  if (available_core.indexOf(name) !== -1) {
    alert('Unable to save: Name already in use');
    return;
  }
  // Hide item
  document.querySelector('#new').style.display = 'none';
  chrome.storage.sync.get(['collections'], function(storage) {
    // Create collection list
    if (!storage.collections) {
      storage.collections = {};
    }
    // Add collection
    storage.collections[name] = true;
    storage['custom_' + name] = content;
    // Update content
    chrome.storage.sync.set(storage, function() {
      // Load new ones again
      getAvailable();
    });
  });
}

// Remove a collection item
function removeCollection(name) {
  if (available_custom.indexOf(name) === -1) {
    alert('Unable to remove: Custom Collection not found');
    return;
  }
  chrome.storage.sync.get(['collections'], function(storage) {
    var id = 'custom_' + name;

    // Remove entry
    if (storage.collections && storage.collections[name]) {
      delete storage.collections[name];
    }

    // Remove object
    chrome.storage.sync.remove(id);

    // Update collection
    chrome.storage.sync.set(storage, function() {
      // Load new ones again
      getAvailable();
    });
  });
}

// On load, get Available collections
window.addEventListener('load', getAvailable, false);

// Generate new fortune
document.querySelector('#fortune').addEventListener('click', generateFortune, false);

// Toggle Options Button
document.querySelector('#toggle').addEventListener('click', function() {
  document.querySelector('#toggle').style.display = 'none';
  restoreOptions();
  document.querySelector('#options').style.display = 'block';
});

// Save Options
document.querySelector('#options_save').addEventListener('click', function() {
  document.querySelector('#options').style.display = 'none';
  saveOptions();
  document.querySelector('#toggle').style.display = 'block';
});

// New Collection in Options
document.querySelector('#options_new').addEventListener('click', function() {
  document.querySelector('#new_name').value = '';
  document.querySelector('#new_content').value = 'Sample Quote 1\n%\nSample Quote 2';
  document.querySelector('#new').style.display = 'block';
});

// Create/Update Collection
document.querySelector('#create').addEventListener('click', function() {
  var name = document.querySelector('#new_name').value.replace(/^\s\s*/, '').replace(/\s\s*$/, ''),
      content = document.querySelector('#new_content').value;

  newCollection(name, content);
});

// Cancel Edit Collection
document.querySelector('#cancel').addEventListener('click', function() {
  document.querySelector('#new').style.display = 'none';
});

// Delete Collection
document.querySelector('#delete').addEventListener('click', function() {
  var name = document.querySelector('#new_name').value;
  if (confirm('Are you sure you want to remove "' + name +'?"')) {
    removeCollection(name);
    document.querySelector('#new').style.display = 'none';
  }
});
