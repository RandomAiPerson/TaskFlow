let activeTab = null;
let startTime = Date.now();

chrome.runtime.onStartup.addListener(()=>{

    openStartupFolders();

});



chrome.runtime.onInstalled.addListener(()=>{

    openStartupFolders();

});





function openStartupFolders(){


    chrome.storage.local.get(
        "manualFolders",
        data=>{


            const folders =
            data.manualFolders || [];



            folders
            .filter(folder => folder.startup === true)
            .forEach(folder=>{


                folder.tabs.forEach(tab=>{


                    if(tab.url){


                        chrome.tabs.create({

                            url:tab.url,

                            active:false

                        });


                    }


                });



            });



        }
    );


}




chrome.tabs.onActivated.addListener(async info=>{


    saveCurrentTabTime();



    try{


        activeTab =
        await chrome.tabs.get(info.tabId);



        startTime = Date.now();



    }
    catch(e){}



});



chrome.tabs.onUpdated.addListener(
async(tabId,change)=>{


    if(change.status==="complete"){


        try{


            const tab =
            await chrome.tabs.get(tabId);



            if(
                activeTab &&
                activeTab.id===tabId
            ){

                activeTab = tab;

            }


        }
        catch(e){}


    }


});






chrome.tabs.onRemoved.addListener(()=>{


    saveCurrentTabTime();


});








function saveCurrentTabTime(){


    if(!activeTab)
        return;




    const seconds =
    Math.floor(
        (Date.now()-startTime)/1000
    );



    if(seconds < 5)
        return;





    chrome.storage.local.get(
        "sessionTabs",
        data=>{


            let tabs =
            data.sessionTabs || [];



            let existing =
            tabs.find(
                t=>t.url===activeTab.url
            );



            if(existing){


                existing.time += seconds;


            }
            else{


                tabs.push({

                    title:activeTab.title,

                    url:activeTab.url,

                    time:seconds

                });


            }



            chrome.storage.local.set({

                sessionTabs:tabs

            });



        }
    );


}

chrome.runtime.onMessage.addListener(
(message)=>{


    if(message.action==="openStartup"){


        openStartupFolders();


    }


});
