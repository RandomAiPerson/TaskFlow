const folderList = document.getElementById("folder-list");
const startupFolders = document.getElementById("startup-folders");

const folderNameInput = document.getElementById("folder-name");
const createFolderButton = document.getElementById("create-folder");
const modalRadio = document.getElementById("modal-new-folder");

const emptyFolder = document.getElementById("empty-folder");


let openedFolders = new Set();

function getFolders(){

    return new Promise(resolve=>{

        chrome.storage.local.get(
            "manualFolders",
            data=>{

                resolve(data.manualFolders || []);

            }
        );

    });

}



function saveFolders(folders){

    return new Promise(resolve=>{

        chrome.storage.local.set(
            {
                manualFolders:folders
            },
            resolve
        );

    });

}


createFolderButton.onclick = async()=>{


    const name =
    folderNameInput.value.trim();



    if(!name)
        return;



    const folders =
    await getFolders();



    folders.push({

        id:Date.now(),

        name:name,

        tabs:[],

        startup:false

    });



    await saveFolders(folders);



    folderNameInput.value="";

    modalRadio.checked=false;



    loadFolders();

    loadStartupFolders();


};




async function loadFolders(){


    const folders =
    await getFolders();



    folderList.innerHTML="";




    if(folders.length===0){

        emptyFolder.style.display="flex";

        return;

    }



    emptyFolder.style.display="none";





    folders.forEach(folder=>{



        const li =
        document.createElement("li");



        li.className="saved-row";



        if(openedFolders.has(folder.id)){

            li.classList.add("open");

        }





        li.innerHTML=`

<div class="row-link">


<span class="folder-icon">
📂
</span>



<div class="item-info">

<strong>
${folder.name}
</strong>


<small>
${folder.tabs.length} tabs
</small>


</div>




<button class="add-tab">
+
</button>




<button class="pin-folder">

${folder.startup ? "⭐":"☆"}

</button>




<button class="delete-folder">

🗑

</button>




<span class="chevron">

›

</span>


</div>



<div class="folder-tabs">

</div>


`;



        const tabsContainer =
        li.querySelector(".folder-tabs");






        folder.tabs.forEach((tab,index)=>{


            const tabRow =
            document.createElement("div");


            tabRow.className="tab-row";



            tabRow.innerHTML=`

<span>
🌐 ${tab.title}
</span>


<button class="delete-tab">

✕

</button>

`;


            tabRow.querySelector(".delete-tab")
            .onclick=async(e)=>{


                e.stopPropagation();


                openedFolders.add(folder.id);



                const folders =
                await getFolders();



                const target =
                folders.find(
                    f=>f.id===folder.id
                );



                target.tabs.splice(index,1);



                await saveFolders(folders);



                loadFolders();


            };



            tabsContainer.appendChild(tabRow);


        });



        li.querySelector(".row-link")
        .onclick=(e)=>{


            if(
                e.target.classList.contains("add-tab") ||
                e.target.classList.contains("pin-folder") ||
                e.target.classList.contains("delete-folder")
            )
            return;




            if(li.classList.contains("open")){


                li.classList.remove("open");

                openedFolders.delete(folder.id);


            }
            else{


                li.classList.add("open");

                openedFolders.add(folder.id);


            }



        };



        li.querySelector(".add-tab")
        .onclick=async(e)=>{


            e.stopPropagation();



            const tabs =
            await chrome.tabs.query({

                currentWindow:true

            });




            const folders =
            await getFolders();



            const target =
            folders.find(
                f=>f.id===folder.id
            );





            tabs.forEach(tab=>{


                target.tabs.push({

                    title:tab.title,

                    url:tab.url

                });


            });




            await saveFolders(folders);



            openedFolders.add(folder.id);



            loadFolders();


        };



        li.querySelector(".pin-folder")
        .onclick=async(e)=>{


            e.stopPropagation();



            const folders =
            await getFolders();



            const target =
            folders.find(
                f=>f.id===folder.id
            );



            target.startup =
            !target.startup;




            await saveFolders(folders);



            loadFolders();

            loadStartupFolders();


        };



        li.querySelector(".delete-folder")
        .onclick=async(e)=>{


            e.stopPropagation();



            const folders =
            await getFolders();



            const updated =
            folders.filter(
                f=>f.id!==folder.id
            );



            await saveFolders(updated);



            openedFolders.delete(folder.id);



            loadFolders();

            loadStartupFolders();


        };








        folderList.appendChild(li);



    });



}


async function loadStartupFolders(){


    if(!startupFolders)
        return;



    const folders =
    await getFolders();




    startupFolders.innerHTML="";




    const startup =
    folders.filter(
        f=>f.startup
    );




    if(startup.length===0){


        startupFolders.innerHTML=`

        <div class="empty-pinned">

        No startup folders

        </div>

        `;


        return;

    }






    startup.forEach(folder=>{


        const div =
        document.createElement("div");



        div.className="pinned-folder";



        div.innerHTML=`

        ⭐ ${folder.name}

        `;





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



document
.querySelector('[for="screen-folders-empty"]')
.onclick=()=>{


    setTimeout(()=>{

        loadFolders();

    },50);


};


loadFolders();
loadStartupFolders();
