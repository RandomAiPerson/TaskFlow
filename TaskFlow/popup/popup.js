const folderList = document.getElementById("folder-list");
const startupFolders = document.getElementById("startup-folders");
const nameInput = document.getElementById("folder-name");
const createBtn = document.getElementById("create-folder");
const modal = document.getElementById("modal-new-folder");
const empty = document.getElementById("empty-folder");

let opened = new Set();

const getFolders = () =>
    new Promise(r => chrome.storage.local.get("manualFolders", d => r(d.manualFolders || [])));

const saveFolders = folders =>
    new Promise(r => chrome.storage.local.set({manualFolders: folders}, r));


createBtn.onclick = async () => {
    let name = nameInput.value.trim();
    if (!name) return;

    let folders = await getFolders();

    folders.push({
        id: Date.now(),
        name,
        tabs: [],
        startup: false
    });

    await saveFolders(folders);

    nameInput.value = "";
    modal.checked = false;

    loadFolders();
    loadStartup();
};


async function loadFolders(){

    let folders = await getFolders();
    folderList.innerHTML = "";

    empty.style.display = folders.length ? "none" : "flex";

    folders.forEach(folder => {

        let li = document.createElement("li");
        li.className = "saved-row";

        if(opened.has(folder.id))
            li.classList.add("open");


        li.innerHTML = `
        <div class="row-link">
            <span class="folder-icon">📂</span>

            <div class="item-info">
                <strong>${folder.name}</strong>
                <small>${folder.tabs.length} tabs</small>
            </div>

            <button class="add-tab">+</button>
            <button class="pin-folder">${folder.startup ? "⭐":"☆"}</button>
            <button class="delete-folder">🗑</button>
            <span class="chevron">›</span>
        </div>

        <div class="folder-tabs"></div>
        `;


        let tabsBox = li.querySelector(".folder-tabs");


        folder.tabs.forEach((tab,i)=>{

            let row = document.createElement("div");
            row.className="tab-row";

            row.innerHTML = `
            <span>🌐 ${tab.title}</span>
            <button class="delete-tab">✕</button>
            `;


            row.querySelector(".delete-tab").onclick = async e => {

                e.stopPropagation();

                opened.add(folder.id);

                let folders = await getFolders();
                let f = folders.find(x=>x.id===folder.id);

                f.tabs.splice(i,1);

                await saveFolders(folders);
                loadFolders();
            };


            tabsBox.appendChild(row);
        });



        li.querySelector(".row-link").onclick = e => {

            if(e.target.tagName==="BUTTON")
                return;

            li.classList.toggle("open");

            li.classList.contains("open")
                ? opened.add(folder.id)
                : opened.delete(folder.id);
        };



        li.querySelector(".add-tab").onclick = async e => {

            e.stopPropagation();

            let tabs = await chrome.tabs.query({
                currentWindow:true
            });

            let folders = await getFolders();
            let f = folders.find(x=>x.id===folder.id);


            tabs.forEach(t=>{
                f.tabs.push({
                    title:t.title,
                    url:t.url
                });
            });


            await saveFolders(folders);

            opened.add(folder.id);
            loadFolders();
        };



        li.querySelector(".pin-folder").onclick = async e => {

            e.stopPropagation();

            let folders = await getFolders();
            let f = folders.find(x=>x.id===folder.id);

            f.startup=!f.startup;

            await saveFolders(folders);

            loadFolders();
            loadStartup();
        };



        li.querySelector(".delete-folder").onclick = async e => {

            e.stopPropagation();

            let folders = await getFolders();

            folders = folders.filter(x=>x.id!==folder.id);

            await saveFolders(folders);

            opened.delete(folder.id);

            loadFolders();
            loadStartup();
        };


        folderList.appendChild(li);
    });
}



async function loadStartup(){

    if(!startupFolders) return;

    let folders = await getFolders();

    let startup = folders.filter(x=>x.startup);

    startupFolders.innerHTML = startup.length
    ? ""
    : `<div class="empty-pinned">No startup folders</div>`;


    startup.forEach(folder=>{

        let div=document.createElement("div");

        div.className="pinned-folder";
        div.textContent="⭐ "+folder.name;


        div.onclick=()=>{

            folder.tabs.forEach(tab=>{
                chrome.tabs.create({
                    url:tab.url
                });
            });

        };


        startupFolders.appendChild(div);
    });
}



document.querySelector('[for="screen-folders-empty"]').onclick=()=>{
    setTimeout(loadFolders,50);
};


loadFolders();
loadStartup();
