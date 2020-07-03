import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";

const commitJobs = async () => {

    const jobsSetupCollectionRef = firebaseDB.collection("jobsSetup");
    const jobsCollectionRef = firebaseDB.collection("jobs");

    const githubResults = await github(0);
    const adzunaResults = await adzuna(1);

    const results = [...githubResults,...adzunaResults];
    const pagination = 25;
    let page = 1;

    while(results.length>0){
        const resultsSet = results.splice(0,pagination);
        await jobsCollectionRef.doc(page.toString())
            .set(Object.assign({},resultsSet))
        if(results.length>0) page++;
    }

    return await jobsSetupCollectionRef.doc("pages")
        .set({'maxPages': page});
}

commitJobs().then( res => console.log(res)).catch(err => console.log(err))
