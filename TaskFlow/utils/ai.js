const API_KEY = "rc_39fcf5993162d1957ec3c4ec7626d776a045a0269e9466e18c2f26141a2994a6";



async function analyzeSession(){


    chrome.storage.local.get(
    "sessionTabs",
    async data=>{


        let tabs =
        data.sessionTabs || [];



        if(tabs.length < 2)
            return;




        tabs.sort(
        (a,b)=>b.time-a.time
        );




        const importantTabs =
        tabs
        .filter(
        t=>t.time >= 60
        )
        .slice(0,8);





        if(importantTabs.length < 2)
            return;






        const prompt = `

You are TaskFlow AI.

Create a browser workspace from these tabs.

Return ONLY JSON.

Format:

{
"name":"",
"category":"",
"description":"",
"tabs":[
{
"title":"",
"url":""
}
]
}


Tabs:

${JSON.stringify(importantTabs)}

`;





        try{


            const response =
            await fetch(
            "https://api.featherless.ai/v1/chat/completions",
            {


                method:"POST",


                headers:{


                    "Content-Type":
                    "application/json",


                    "Authorization":
                    `Bearer ${API_KEY}`


                },


                body:JSON.stringify({


                    model:
                    "Qwen/Qwen2.5-7B-Instruct",


                    max_tokens:1024,


                    messages:[


                    {


                    role:"system",

                    content:
                    "You organize browser workflows."

                    },


                    {


                    role:"user",

                    content:prompt

                    }


                    ]


                })



            });







            const result =
            await response.json();





            let text =
            result
            .choices[0]
            .message
            .content;




            text =
            text.replace(
            /```json|```/g,
            ""
            );




            const workflow =
            JSON.parse(text);






            chrome.storage.local.set({

                suggestion:workflow

            });






        }
        catch(e){


            console.log(
            "AI ERROR",
            e
            );


        }





    });


}