
        function changeFavicon(url) {
            var link = document.createElement('link'),
                oldLink = document.querySelector('link[rel="shortcut icon"]') || document.querySelector('link[rel="icon"]');
            link.rel = 'shortcut icon';
            link.href = url;
        
            if (oldLink) {
                document.head.removeChild(oldLink);
            }
            document.head.appendChild(link);
        }
        var faviconUrl = 'https://reticulated.net/favicon/favicon.ico';
        changeFavicon(faviconUrl);
        var entryTitle = document.getElementById("entry-title"),
            entryList = document.getElementById("entry-list"),
            entryContent = document.getElementById("entry-content"),
            entryContentStorage = document.getElementById("entry-content-storage"),
            saveDbButton = document.getElementById("save-db-button"),
            loadDbButton = document.getElementById("load-db-button"),
            saveButton = document.getElementById("save-button"),
            fileInput = document.getElementById("file-input"),
            entries = [],
            current = -1;

            

            function loadEntries() {
                var storedEntries = entryContentStorage.value;
                if (!storedEntries) {
                    entries = [];
                    updateEntryList();
                    return;
                }
                try {
                    entries = JSON.parse(storedEntries);
                        entries.forEach(entry => {
                            var entryElement = document.querySelector(`[data-index='${entry.id}']`);
                            if (entryElement) {
                                if (entry.color) {
                                    var entryElement = document.querySelector(`[data-index='${entry.id}']`);
                                    if (entryElement) {
                                        updateEntryColor(entryElement, entry.color);
                                    }
                                }
                                if (entry.titleBarColor) {
                                    var entryElement = document.querySelector(`[data-index='${entry.id}']`);
                                    var titleBar = entryElement.querySelector('.pane-title');
                                    if (titleBar) {
                                        titleBar.style.backgroundColor = entry.titleBarColor;
                                    }
                                }
                            }
                            
                        });
                        updateEntryList();
                        if (entries.length > 0) {
                            current = 0;
                            clearAndLoadEntry(entries[current]);
                        }
                } catch (e) {
                    console.error('Error parsing entries:', e);
                }
                  
                
            }


        function saveEntries() {
            entryContentStorage.value = JSON.stringify(entries);
        }

        function savePaneContent() {
            var allPanes = entryContent.querySelectorAll('.entry-pane');
            allPanes.forEach(pane => {
                var entryId = pane.dataset.entryId;
                var contentDiv = pane.querySelector('div[contenteditable="true"]');
                if (contentDiv && entryId !== undefined) {
                    var entryIndex = entries.findIndex(entry => entry.id.toString() === entryId);
                    if (entryIndex !== -1) {
                        var contentHtml = contentDiv.innerHTML.replace(%2F<input type="checkbox"[^>]*>%2Fg, match => {
                            return match.includes('checked') ? '[x]' : '[ ]';
                        });
                        entries[entryIndex].content = contentHtml;
                    }
                }
            });
            saveEntries();
        }
        
        
        
        
        function addNewEntry(title) {
            var newEntry = { id: entries.length, title: title, content: "", titleBarColor: 'default', contentBackgroundColor: 'default' };
            entries.push(newEntry);
            return newEntry;
        }
        
        

        function reorderEntries(sourceIndex, targetIndex) {
            if (sourceIndex === targetIndex) return;
            const movedItem = entries.splice(sourceIndex, 1)[0];
            entries.splice(targetIndex, 0, movedItem);
            updateEntryList();
            saveEntries();
        }
        
        function attachColorPickerEventHandler(pane, entry) {
            var bgColorPickerIcon = pane.querySelector('.bg-color-picker-icon');
            if (bgColorPickerIcon) {
                bgColorPickerIcon.onclick = function(event) {
                    event.stopPropagation();
                    showContentColorPicker(pane.querySelector('.content-editable'), entry);
                };
            }
        }
        
        
        
        function updateEntryList() {
            entryList.innerHTML = "";
            entries.forEach(function(entry, index) {
                var e = document.createElement("div");
                e.className = "entry-item";
                
                e.setAttribute('data-index', index.toString());
                e.draggable = true;
                if (entry.titleBarColor && entry.titleBarColor !== 'default') {
                    updateEntryColor(e, entry.titleBarColor);
                }        
                e.ondragstart = function(event) {
                    event.dataTransfer.setData("text/index", index.toString());
                };
        
                e.ondragover = function(event) {
                    event.preventDefault();
                };
        
                e.ondrop = function(event) {
                    event.preventDefault();
                    var sourceIndex = event.dataTransfer.getData("text/index");
                    var targetIndex = index;
                    reorderEntries(parseInt(sourceIndex), parseInt(targetIndex));
                };
                var textSpan = document.createElement("span");
                textSpan.textContent = entry.title;
                
                e.ondblclick = function(event) {
                    var newName = prompt("Enter a new name for this entry:", entry.title);
                    if (newName && newName !== entry.title) {
                        entry.title = newName;
                        updateEntryList();
                        saveEntries();
                    }
                };        
                e.appendChild(textSpan);
            
                var deleteBtn = document.createElement("button");
                deleteBtn.textContent = "X";
                deleteBtn.className = "delete-btn";
                deleteBtn.onclick = function(event) {
                    event.stopPropagation();
                    if (confirm("Are you sure you want to delete this note?")) { 
                        entries.splice(index, 1);
                        if (current === index) {
                            current = -1;
                            entryContent.classList.remove('active');
                        }
                        updateEntryList();
                        updateEntryContent();
                        saveEntries();
                    }
                };

                var colorBtn = document.createElement("button");
                colorBtn.textContent = "🎨";
                colorBtn.className = "color-btn";
                colorBtn.onclick = function(event) {
                    event.stopPropagation();
                    showColorPicker(e, entry);
                };
                            
            

                var buttonContainer = document.createElement("div");
                buttonContainer.className = "button-container";
                buttonContainer.appendChild(colorBtn);
                buttonContainer.appendChild(deleteBtn);
                
            
                e.appendChild(buttonContainer);
            
                if (index === current) {
                    e.classList.add("active");
                    entryContent.classList.add('active');
                }

                if (entry.color && entry.color !== 'none') {
                    updateEntryColor(e, entry.color);
                }
            
                e.onclick = function() {
                    current = index;
                    clearAndLoadEntry(entries[index]);
                    updateEntryContent();
                    updateEntryList();
                };

                entryList.appendChild(e);
            });
        }

        function updateEntryColor(entryElement, color) {
            var styles = colorStyles[color];
            if (styles) {
                entryElement.style.backgroundColor = styles.backgroundColor;
                entryElement.style.color = styles.color;
        
                var entryIndex = parseInt(entryElement.dataset.index);
                var entry = entries[entryIndex];
                if (entry) {
                    entry.titleBarColor = color; 
                    saveEntries();
                }
        
                var pane = entryContent.querySelector(`[data-entry-id='${entryIndex}']`);
                if (pane) {
                    var titleBar = pane.querySelector('.pane-title');
                    if (titleBar) {
                        titleBar.style.backgroundColor = styles.backgroundColor;
                        titleBar.style.color = styles.color;
                    }
                }
            }
        }
        

        
        
        
        

        function showColorPicker(entryElement, entry) {
            var colorPicker = document.createElement("div");
            colorPicker.className = "color-picker";
        
            var colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'grey', 'black', 'white'];
            colors.forEach(function(color) {
                var colorOption = document.createElement("div");
                colorOption.className = "color-option";
                colorOption.style.backgroundColor = colorStyles[color].backgroundColor;
                colorOption.onclick = function() {
                    var selectedColor = color; 
                    updateEntryColor(entryElement, selectedColor);
                    document.body.removeChild(colorPicker);
                };
            
            
                            
                colorPicker.appendChild(colorOption);
            });
        
            document.body.appendChild(colorPicker);
        }
        
        
        var colorStyles = {
            red: { backgroundColor: '%23ffcccc', color: 'black' },
            blue: { backgroundColor: '%23cceeff', color: 'black' },
            green: { backgroundColor: '%23ccffcc', color: 'black' },
            yellow: { backgroundColor: '%23ffff99', color: 'black' },
            orange: { backgroundColor: '%23ffcc99', color: 'black' },
            purple: { backgroundColor: '%23e6ccff', color: 'black' },
            pink: { backgroundColor: '%23ffccff', color: 'black' },
            brown: { backgroundColor: '%23d2b48c', color: 'black' },
            grey: { backgroundColor: '%23cccccc', color: 'black' },
            black: { backgroundColor: '%23000000', color: 'white' },
            white: { backgroundColor: '%23ffffff', color: 'black' }
        };

        function reorderPanes(sourcePaneId, targetPaneId) {
            if (sourcePaneId === targetPaneId) return;
        
            var sourcePane = entryContent.querySelector(`[data-entry-id='${sourcePaneId}']`);
            var targetPane = entryContent.querySelector(`[data-entry-id='${targetPaneId}']`);
        
            console.log("Source Pane:", sourcePane, "Target Pane:", targetPane);
        
            if (sourcePane && targetPane) {
                var isSourceBeforeTarget = sourcePane.compareDocumentPosition(targetPane) & Node.DOCUMENT_POSITION_FOLLOWING;
                
                if (isSourceBeforeTarget) {
                    targetPane.parentNode.insertBefore(sourcePane, targetPane.nextSibling);
                } else {
                    targetPane.parentNode.insertBefore(sourcePane, targetPane);
                }
                
                adjustPaneSizes(); 
            }
        }
        
        

        function adjustPaneSizes() {
            Array.from(entryContent.querySelectorAll('.split-horizontal, .split-vertical')).forEach(container => {
                Array.from(container.children).forEach(pane => {
                    pane.style.flex = '1';
                });
            });
        }

        function moveEntry(index, direction) {
            if ((direction === 'up' && index > 0) || (direction === 'down' && index < entries.length - 1)) {
                var entryToMove = entries[index];
                entries.splice(index, 1);
                entries.splice(direction === 'up' ? index - 1 : index + 1, 0, entryToMove);
                current = direction === 'up' ? index - 1 : index + 1;
                updateEntryList();
                updateEntryContent();
                saveEntries();
            }
        }

        function updateEntryContent() {
            if (current >= 0) {
                entryContent.innerText = entries[current].content;
                entryContent.classList.add('active');
            } else {
                entryContent.innerText = "";
                entryContent.classList.remove('active');
            }
        }

        function showContentColorPicker(contentDiv, entry) {
            var colorPicker = document.createElement("div");
            colorPicker.className = "color-picker";
        
            var colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'grey', 'black', 'white'];
            colors.forEach(function(color) {
                var colorOption = document.createElement("div");
                colorOption.className = "color-option";
                colorOption.style.backgroundColor = colorStyles[color].backgroundColor;
                colorOption.onclick = function() {
                    var selectedColor = color;
                    contentDiv.style.backgroundColor = colorStyles[selectedColor].backgroundColor;
                    entry.contentBackgroundColor = selectedColor;
                    saveEntries();
                    document.body.removeChild(colorPicker);
                };
                        colorPicker.appendChild(colorOption);
            });
        
            document.body.appendChild(colorPicker);
        }
        


        function createPane(entry, entryIndex) {
            var pane = document.createElement('div');
            pane.className = 'entry-pane';
            pane.dataset.entryId = entryIndex.toString();
        
            var titleBar = document.createElement('div');
            titleBar.className = 'pane-title';
            titleBar.textContent = entry.title;
            titleBar.draggable = true;
            titleBar.ondragstart = function(event) {
                event.dataTransfer.setData("pane-id", entryIndex.toString());
            };
        
            pane.appendChild(titleBar);
        
            if (entry.titleBarColor && colorStyles[entry.titleBarColor]) {
                titleBar.style.backgroundColor = colorStyles[entry.titleBarColor].backgroundColor;
                titleBar.style.color = colorStyles[entry.titleBarColor].color;
            }
        
            var contentDiv = document.createElement('div');
            contentDiv.contentEditable = true;
            contentDiv.innerHTML = entry.content;
            contentDiv.className = 'content-editable';
        
            if (entry.contentBackgroundColor && colorStyles[entry.contentBackgroundColor]) {
                contentDiv.style.backgroundColor = colorStyles[entry.contentBackgroundColor].backgroundColor;
            }
        
            pane.appendChild(contentDiv);
        
            var bgColorPickerIcon = document.createElement('span');
            bgColorPickerIcon.className = 'bg-color-picker-icon';
            bgColorPickerIcon.textContent = '🎨';
            bgColorPickerIcon.style.position = 'absolute';
            bgColorPickerIcon.style.bottom = '10px';
            bgColorPickerIcon.style.right = '10px';
            pane.appendChild(bgColorPickerIcon);
        
            return pane;
        }
        
        
        
                
        
        function clearAndLoadEntry(entry) {
            entryContent.innerHTML = '';
            var pane = createPane(entry, entry.id);
            entryContent.appendChild(pane);
        
            var contentDiv = pane.querySelector('.content-editable');
            if (entry.contentBackgroundColor && colorStyles[entry.contentBackgroundColor]) {
                contentDiv.style.backgroundColor = colorStyles[entry.contentBackgroundColor].backgroundColor;
            }
        
            contentDiv.innerHTML = entry.content.replace(%2F%5C[ \]%2Fg, '<input type="checkbox">')
            .replace(%2F%5C[x%5C]%2Fg, '<input type="checkbox" checked>');
}

        
        
        
        function splitPane(container, entryToSplit) {
            var entryIndex = entries.findIndex(entry => entry === entryToSplit);
            if (entryIndex === -1) return; 
        
            var newPane = createPane(entryToSplit, entryIndex);
        
            if (container.children.length === 0) {
                container.appendChild(newPane);
            } else {
                var existingSplitContainer = container.querySelector('.split-horizontal');
                if (existingSplitContainer) {
                    existingSplitContainer.appendChild(newPane);
                } else {
                    var splitContainer = document.createElement('div');
                    splitContainer.className = 'split-horizontal';
                    splitContainer.appendChild(container.firstChild.cloneNode(true));
                    splitContainer.appendChild(newPane);
        
                    container.innerHTML = '';
                    container.appendChild(splitContainer);
                }
            }
            adjustPaneSizes();
        }
        
        
        
        
        
        
        
        
        
        
        
        

        saveDbButton.addEventListener('click', function() {
            var content = entryContentStorage.value,
                blob = new Blob([content], {type: 'text/plain;charset=utf-8'}),
                a = document.createElement('a'),
                date = new Date(),
                dateString = date.toISOString().split('T')[0];

            var url = URL.createObjectURL(blob);
            a.href = url;
            a.download = 'notes_database_' + dateString + '.txt';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });

        loadDbButton.addEventListener('click', function() {
            fileInput.click();
            fileInput.onchange = function(e) {
                var file = e.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(event) {
                        entryContentStorage.value = event.target.result;
                        loadEntries();
                    };
                    reader.readAsText(file);
                }
            };
        });
        

        fileInput.addEventListener('change', function() {
            var file = fileInput.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    entryContentStorage.value = e.target.result;
                    loadEntries();
                };
                reader.readAsText(file);
            }
        });


        entryTitle.addEventListener("keyup", function(t) {
            if (t.keyCode === 13) {
                var title = entryTitle.value.trim();
                if (title) {
                    var newEntry = addNewEntry(title);
                    current = newEntry.id; 
                    updateEntryList();
                    clearAndLoadEntry(newEntry); 
                    entryTitle.value = "";
                }
            }
        });

        document.addEventListener('DOMContentLoaded', (event) => {
            loadEntries();
        });
        

 

        saveButton.addEventListener('click', function() {
            if (current >= 0) {
                var content = entries[current].content;
                content = content.replace(%2F<br%5Cs*[%5C%2F]%3F>%2Fgi, "\n")
                    .replace(%2F<%5C%2F(p|div|h[1-6])>%2Fgi, "\n")
                    .replace(%2F<[^>]*>%2Fg, ""); 
               var title = entries[current].title || 'note';
                var blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
                var a = document.createElement('a');
                var url = URL.createObjectURL(blob);
                a.href = url;
                a.download = title + '.txt';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        });
        

        entryContent.addEventListener('dragover', function(event) {
            event.preventDefault();
        });
        

 
        
        entryContent.ondrop = function(event) {
            event.preventDefault();
            var targetPane = event.target.closest('.entry-pane');
            if (!targetPane) return;
        
            var sourcePaneId = event.dataTransfer.getData("pane-id");
            var targetPaneId = targetPane.dataset.entryId;
        
            console.log("Dropped on pane ID:", targetPaneId, "Dragging pane ID:", sourcePaneId);
        
            if (sourcePaneId && targetPaneId && sourcePaneId !== targetPaneId) {
                reorderPanes(sourcePaneId, targetPaneId);
            }
        };
        
        
        
        
        
        
        
        
        entryContent.ondragover = function(event) {
            event.preventDefault();
        };
        
                
                        
        

        entryContent.addEventListener('input', function() {
            savePaneContent();
        });

        entryList.ondragover = function(event) {
            event.preventDefault();
        };
        

        entryList.addEventListener('click', function(event) {
            var target = event.target.closest('.entry-item');
            if (target) {
                var index = target.getAttribute('data-index');
                clearAndLoadEntry(entries[index]);
            }
        });
        
        entryList.ondrop = function(event) {
            event.preventDefault();
            var targetIndex = event.target.getAttribute('data-index');
            var sourceIndex = event.dataTransfer.getData("text/plain");
        
            if (sourceIndex !== null && targetIndex !== null) {
                reorderEntries(parseInt(sourceIndex), parseInt(targetIndex));
            }
        };
        
        
        document.getElementById('entry-content').addEventListener('click', function(event) {
            if (event.target.classList.contains('bg-color-picker-icon')) {
                var pane = event.target.closest('.entry-pane');
                var entryId = pane.dataset.entryId;
                var entry = entries.find(e => e.id.toString() === entryId);
                if (entry) {
                    var contentDiv = pane.querySelector('.content-editable');
                    showContentColorPicker(contentDiv, entry);
                }
            }
        });
        

        entryList.addEventListener('dragstart', function(event) {
            if (event.target.classList.contains('entry-item')) {
                var entryIndex = event.target.getAttribute('data-index');
                event.dataTransfer.setData("entry-index", entryIndex);
            }
        });        
        entryContent.addEventListener('drop', function(event) {
            event.preventDefault();
            var entryIndex = event.dataTransfer.getData("entry-index");
        
            if (entryIndex !== null) {
                var entryToSplit = entries[parseInt(entryIndex)];
                splitPane(entryContent, entryToSplit);
            }
        });
        
        
        
        setTimeout(loadEntries, 250);

        