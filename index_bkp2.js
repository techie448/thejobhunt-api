import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import algolia from "./algolia.js";
import workintech from "./workintech.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"

const getResults = async ({testing, queries}) => {
    let githubResults = [];
    let adzunaResults = [];
    let glassdoorResults = [];
    let indeedResults = [];
    let linkedinResults = [];
    let workintechResults = [];

    for (const query of queries) {
        const initial = githubResults.length + adzunaResults.length + glassdoorResults.length + indeedResults.length + linkedinResults.length;

        const [githubFetch, adzunaFetch, glassdoorFetch, indeedFetch, linkedinFetch, workintechFetch] = await Promise.all([
            github(testing, query),
            adzuna(testing, query),
            glassdoor(testing, query),
            indeed(testing, query),
            linkedin(testing, query),
            workintech_api(testing, query),
        ]);

        githubResults.push(...githubFetch);
        console.log(`${query} githubResults ${githubFetch.length}`)
        adzunaResults.push(...adzunaFetch);
        console.log(`${query} adzunaResults ${adzunaFetch.length}`)
        glassdoorResults.push(...glassdoorFetch);
        console.log(`${query} glassdoorResults ${glassdoorFetch.length}`)
        indeedResults.push(...indeedFetch);
        console.log(`${query} indeedResults ${indeedFetch.length}`)
        linkedinResults.push(...linkedinFetch);
        console.log(`${query} linkedinResults ${linkedinFetch.length}`)
        workintechResults.push(...workintechFetch);
        console.log(`${query} workintechResults ${workintechFetch.length}`)

        const afterFetch = githubResults.length + adzunaResults.length + glassdoorResults.length + indeedResults.length + linkedinResults.length;

        console.log(`ADDED : ${afterFetch-initial}`)
    }



    return [
        ...githubResults,
        ...adzunaResults,
        ...glassdoorResults,
        ...indeedResults,
        ...linkedinResults,
        ...workintechResults
    ];
}

const deleteOldJobs = async (jobsCollectionRef, results) => {
    const snapshot = await jobsCollectionRef.get();
    const snapshotData = await snapshot.docs.map(doc => doc.data())
    console.log(`retrieved snapshot from firebase ${snapshotData.length}`)

    console.log(`deleting old jobs`)

    for (const job of snapshotData) {
        if (!results.some(j => j.id === job.id)) await jobsCollectionRef.doc(job.id).delete();
    }

}

const updateNewJobs = async (jobsCollectionRef, results) => {

    for (const result of results) {
        if(!result.id) result.id = jobsCollectionRef.doc().id;
        await jobsCollectionRef.doc(result.id).set(result)
    }
}

const commitJobs = async () => {

    console.log(new Date())

    const jobsCollectionRef = firebaseDB.collection("jobs");

    const results = await getResults({
        testing: true,
        queries: [
            'Junior Software Developer',
            'Junior Web Developer',
            'Junior Software Engineer',
            'Junior Web Engineer',
            // 'Web Developer',
            // 'Web engineer',
            // 'Software Developer',
            // 'Software engineer',
            // 'javascript',
            // 'javascript Developer',
            // 'js',
            // 'Fullstack Developer',
            // 'full-stack Developer',
            // 'Fullstack',
            // 'Front end Developer',
            // 'Front-end Developer',
            // 'Frontend',
            // 'Back end Developer',
            // 'Back-end Developer',
            // 'Backend',
            // 'react developer',
            // 'react engineer',
            // 'react',
            // 'vue developer',
            // 'vue',
            // 'angular developer',
            // 'angular',
            // 'node developer',
            // 'node',
            // 'node.js',
            // 'nodejs',
            // 'php developer',
            // 'php',
            // 'laravel developer',
            // 'laravel',
            // 'wordpress',
            // 'wordpress developer',
            // 'java developer',
            // 'java',
            // 'spring',
            // 'spring developer',
            // 'spring java developer',
            // 'express',
            // 'expressjs',
            // 'express.js',
            // 'python developer',
            // 'django',
            // 'django developer',
        ]
    })

    console.log(`fetched ${results.length} jobs in total`)

    results.forEach(job=>job.created = getDate(job.created))

    console.log(`add datetimestamps`)

    const uniqueJobsObject = {};

    results.forEach(job => uniqueJobsObject[job.id] = job);

    const uniqueJobs = Object.values(uniqueJobsObject);

    // await deleteOldJobs(jobsCollectionRef, uniqueJobs)
    // await updateNewJobs(jobsCollectionRef, uniqueJobs)
    // await algolia(uniqueJobs)

    return {
        total : results.length,
        unique : uniqueJobs.length,
        diff : (results.length - uniqueJobs.length),
    };

}

commitJobs().then( res => console.log(res)).catch(err => console.log(err))
