const folderList = document.getElementById("folder-list");
const presetList = document.getElementById("preset-list");

const folderNameInput = document.getElementById("folder-name");
const modalRadio = document.getElementById("modal-new-folder");

const aiContainer = document.getElementById("ai-container");



async function getCurrentTab(){

    const tabs = await chrome.tabs.query({
        active:true,
        currentWindow:true
    });

    return tabs[0];

}





// =========================
// NAVIGATION
// =========================


document
.querySelector('label[for="screen-folders-empty"]')
.onclick=()=>{

    setTimeout(loadManualFolders,100);

};



document
.querySelector('label[for="screen-presets-empty"]')
.onclick=()=>{

    setTimeout(loadAIPresets,100);

};








// =========================
// CREATE FOLDER
// =========================


document
.querySelector(".modal-actions .primary-btn")
.onclick=()=>{


    const name =
    folderNameInput.value.trim();


    if(!name)
        return;



    chrome.storage.local.get(
    "manualFolders",
    data=>{


        let folders =
        data.manualFolders || [];



        folders.push({

            id:Date.now(),

            name:name,

            tabs:[]

        });



        chrome.storage.local.set({

            manualFolders:folders

        },()=>{


            folderNameInput.value="";

            modalRadio.checked=false;

            loadManualFolders();


        });



    });


};









// =========================
// LOAD MANUAL FOLDERS
// =========================


function loadManualFolders(){


chrome.storage.local.get(
"manualFolders",
data=>{


folderList.innerHTML="";


let folders =
data.manualFolders || [];



if(folders.length===0){


folderList.innerHTML=`

<li class="saved-row">

<button class="row-link">

<span class="item-info">

<strong>
No folders yet
</strong>

</span>

</button>

</li>

`;

return;

}






folders.forEach(folder=>{


const li =
document.createElement("li");


li.className="saved-row";



li.innerHTML=`

<div class="row-link">


<span class="folder-icon">
📁
</span>


<span class="item-info">

<strong>
${folder.name}
</strong>


<small>
${folder.tabs.length} tabs
</small>


</span>


<button class="add-tab">
+
</button>


<button class="delete-folder">
🗑
</button>


<span class="chevron">
›
</span>


</div>



<div class="folder-tabs"></div>


`;






const tabsContainer =
li.querySelector(".folder-tabs");






// TAB LIST

folder.tabs.forEach((tab,index)=>{


const row =
document.createElement("div");


row.className="tab-row";


row.innerHTML=`

<span>
🌐 ${tab.title}
</span>


<button class="delete-tab">
✕
</button>

`;






row.querySelector(".delete-tab")
.onclick=(e)=>{


e.stopPropagation();



chrome.storage.local.get(
"manualFolders",
result=>{


let folders =
result.manualFolders || [];



let target =
folders.find(
x=>x.id===folder.id
);



target.tabs.splice(index,1);



chrome.storage.local.set({

manualFolders:folders

},()=>{


loadManualFolders();


});


});


};





tabsContainer.appendChild(row);



});









// OPEN FOLDER

li.querySelector(".row-link")
.onclick=(e)=>{


if(
e.target.classList.contains("add-tab") ||
e.target.classList.contains("delete-folder")
)
return;



folder.tabs.forEach(tab=>{


chrome.tabs.create({

url:tab.url

});


});


};









// ADD TAB

li.querySelector(".add-tab")
.onclick=async(e)=>{


e.stopPropagation();



const tab =
await getCurrentTab();



chrome.storage.local.get(
"manualFolders",
result=>{


let folders =
result.manualFolders || [];



let target =
folders.find(
x=>x.id===folder.id
);



target.tabs.push({

title:tab.title,

url:tab.url

});



chrome.storage.local.set({

manualFolders:folders

},()=>{


loadManualFolders();


});


});


};









// DELETE FOLDER


li.querySelector(".delete-folder")
.onclick=(e)=>{


e.stopPropagation();



if(
!confirm(
`Delete ${folder.name}?`
)
)
return;



chrome.storage.local.get(
"manualFolders",
result=>{


let folders =
result.manualFolders || [];



folders =
folders.filter(
x=>x.id!==folder.id
);



chrome.storage.local.set({

manualFolders:folders

},()=>{


loadManualFolders();


});


});


};






folderList.appendChild(li);



});



});


}









// =========================
// AI PRESETS
// =========================


function loadAIPresets(){


chrome.storage.local.get(
"aiPresets",
data=>{


presetList.innerHTML="";



let presets =
data.aiPresets || [];



if(presets.length===0){


presetList.innerHTML=`

<li class="saved-row">

<button class="row-link">

<span class="item-info">

<strong>
No AI presets yet
</strong>

</span>

</button>

</li>

`;

return;

}






presets.forEach(preset=>{


const li =
document.createElement("li");


li.className="saved-row";



li.innerHTML=`

<button class="row-link">


<span class="folder-icon">
🤖
</span>


<span class="item-info">


<strong>
${preset.name}
</strong>


<small>
${preset.category}
</small>


</span>


<span class="open-badge">
Open
</span>


</button>

`;




li.onclick=()=>{


preset.tabs.forEach(tab=>{


chrome.tabs.create({

url:tab.url

});


});


};



presetList.appendChild(li);



});


});


}









// =========================
// AI SUGGESTION
// =========================


function loadSuggestion(){


chrome.storage.local.get(
"suggestion",
data=>{


if(!data.suggestion)
return;



if(document.querySelector(".ai-card"))
return;




const s =
data.suggestion;



const card =
document.createElement("div");


card.className="ai-card";



card.innerHTML=`

<div class="ai-title">
🤖 ${s.name}
</div>


<div class="ai-category">
${s.category}
</div>


<div class="ai-description">
${s.description}
</div>


<div class="ai-actions">

<button class="ai-accept">
Accept
</button>


<button class="ai-delete">
Delete
</button>


</div>

`;




aiContainer.appendChild(card);





card
.querySelector(".ai-accept")
.onclick=()=>{


chrome.storage.local.get(
[
"aiPresets",
"sessionTabs"
],
result=>{


let presets =
result.aiPresets || [];



presets.push({

id:Date.now(),

name:s.name,

category:s.category,

description:s.description,

tabs:s.tabs || result.sessionTabs || []

});



chrome.storage.local.set({

aiPresets:presets

});



chrome.storage.local.remove(
"suggestion"
);



card.remove();



});


};






card
.querySelector(".ai-delete")
.onclick=()=>{


chrome.storage.local.remove(
"suggestion"
);


card.remove();


};


});


}






chrome.storage.onChanged.addListener(
changes=>{


if(changes.suggestion)
loadSuggestion();


});





loadManualFolders();
loadAIPresets();
loadSuggestion();