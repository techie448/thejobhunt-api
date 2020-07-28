import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import algolia from "./algolia.js";
import workintech from "./workintech.js";
import {getDate, permute} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import puppeteer from "puppeteer";

const pushArrayToObject = (arr, obj) => arr.forEach(el => obj[el.id] = el);

const getResults = async ({results, testing, queries}) => {
    const browser = await puppeteer.launch();
    for (const query of queries) {

        console.log(query);

        const promises = await Promise.all([
            github(testing, query),
            adzuna(testing, query),
            glassdoor(testing, query, browser),
            indeed(testing, query, browser),
            linkedin(testing, query, browser),
            workintech_api(testing, query),
        ]);


        promises.forEach(pr=>pr.forEach(el=>el.query = query));
        let streak = 0;
        const initial = Object.keys(results).length;
        let total = 0;
        promises.forEach(promise => {
            const initial = Object.keys(results).length;
            pushArrayToObject(promise, results)
            const afterUpdate = Object.keys(results).length;
            total+=promise.length;
            if((afterUpdate - initial) === 0 && promise.length > 0) streak++;
            else streak = 0;
            if(streak>5) console.log({
                streak,
                source: promise[0].source,
                initial,
                afterUpdate,
                fetch : promise.length,
                diff : afterUpdate - initial
            })

        })
        const final = Object.keys(results).length;
        console.log({
            total,
            new : final - initial,
            duplicates : total - (final - initial),
            final
        });


    }
    await browser.close();
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
    const results = {};
//todo: sort based on results and remove lower results, run once again after sort and remove.
    await getResults({
        results: results,
        testing: false,
        queries: [
            'Software Engineer',
            'Software Developer',
            'Web Developer',
            'Web Software Developer',
            'Web Software engineer',
            'fullstack Developer',
            'javascript Developer',
            'Full stack Developer',
            'Front end Developer',
            'Back end Developer',
            'react developer',
            'react software developer',
            'react engineer',
            'react software engineer',
            'vue developer',
            'angular developer',
            'php developer',
            'wordpress developer',
            'java developer',
            'java software developer',
            'python developer',
            'django developer',
            'Junior Software Developer',
            'Junior fullstack Developer',
            'Junior Software Engineer',
            'Junior Developer',
        ]
    })

    console.log(`add datetimestamps`)

    const uniqueJobs = Object.values(results);

    uniqueJobs.forEach(job=>job.created = getDate(job.created))
    console.log(new Date())

    console.log(uniqueJobs.length)
    // await deleteOldJobs(jobsCollectionRef, uniqueJobs)
    // await updateNewJobs(jobsCollectionRef, uniqueJobs)
    await algolia(uniqueJobs)


}

commitJobs().then( res => console.log(res)).catch(err => console.log(err))
