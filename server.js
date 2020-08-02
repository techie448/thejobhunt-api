import firebaseDB from "./firebaseDB.js";
import github from "./github.js";
import adzuna from "./adzuna.js";
import glassdoor from "./glassdoor.js";
import indeed from "./indeed.js";
import linkedin from "./linkedin.js";
import algolia from "./algolia.js";
import {getDate} from "./utilities.js";
import workintech_api from "./workintech-aloglia-api.js"
import algoliasearch from "algoliasearch";
import chromium from 'chrome-aws-lambda';
const pushArrayToObject = (arr, obj) => arr.forEach(el => obj[el.id] = el);

const getResultsParallel = async ({results, testing, queries}) => {
    const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
    });

    await Promise.all(queries.map(async query => {
        const promises = await Promise.all([github(testing, query),
            adzuna(testing, query),
            glassdoor(testing, query, browser),
            indeed(testing, query, browser),
            linkedin(testing, query, browser),
            workintech_api(testing, query),
        ]);
        const initial = Object.keys(results).length;
        let total = 0;
        promises.forEach(promise => {
            promise.forEach(el=>el.query = query)
            pushArrayToObject(promise, results)
            total+=promise.length;
        });
        const final = Object.keys(results).length;
        console.log({
            total,
            new : final - initial,
            duplicates : total - (final - initial),
            final
        });
        return promises;
    }))


    await browser.close();
}

const getResults = async ({results, testing, queries}) => {
    const browser = await puppeteer.launch();
    for (const query of queries) {

        // console.log(query);

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
        // console.log({
        //     total,
        //     new : final - initial,
        //     duplicates : total - (final - initial),
        //     final
        // });


    }
    await browser.close();
}

const deleteOldJobs = async (jobsCollectionRef, results) => {
    const snapshot = await jobsCollectionRef.get();
    const snapshotData = await snapshot.docs.map(doc => doc.data())
    console.log(`retrieved snapshot from firebase ${snapshotData.length}`)

    console.log(`deleting old jobs`)

    let batch = firebaseDB.batch()
    let count = 0;
    for (const job of snapshotData) {
        if (!results.some(j => j.id === job.id)) {
            batch.delete(jobsCollectionRef.doc(job.id));
            count++;
            if(count===499 || job === snapshotData[snapshotData.length - 1]){
                count = 0;
                const committed = await batch.commit();
                console.log(committed)
                batch = firebaseDB.batch()

            }
        }
    }
}

const updateNewJobs = async (jobsCollectionRef, results) => {
    console.log('starting batch')
    let batch = firebaseDB.batch()
    let count = 0;
    for (const result of results) {
        if(!result.id) result.id = jobsCollectionRef.doc().id;
        const docRef = jobsCollectionRef.doc(result.id);
        console.log(results.indexOf(result))
        batch.set(docRef, result);
        count++;
        if(count===499 || result === results[results.length - 1]){
            count = 0;
            const committed = await batch.commit();
            console.log(committed)
            batch = firebaseDB.batch()
        }
    }
}

const commitJobs = async () => {

    const jobsCollectionRef = firebaseDB.collection("jobs");
    let results = {};
    const args = {
        results: results,
        testing: true,
        queries: [
            'Software Engineer',
            'Software Developer',
            // 'Web Developer',
            // 'Web Software Developer',
            // 'Web Software engineer',
            // 'fullstack Developer',
            // 'javascript Developer',
            // 'Full stack Developer',
            // 'Front end Developer',
            // 'Back end Developer',
            // 'react developer',
            // 'react software developer',
            // 'react engineer',
            // 'react software engineer',
            // 'vue developer',
            // 'angular developer',
            // 'php developer',
            // 'wordpress developer',
            // 'java developer',
            // 'java software developer',
            // 'python developer',
            // 'django developer',
            // 'Junior Software Developer',
            // 'Junior fullstack Developer',
            // 'Junior Software Engineer',
            // 'Junior Developer',
        ]
    };
    console.time()
    await getResultsParallel(args)
    console.timeEnd()
    const uniqueJobs = Object.values(results);

    console.log(`add datetimestamps`)

    uniqueJobs.forEach(job=>job.created = getDate(job.created))

    console.log(uniqueJobs.length)
    await deleteOldJobs(jobsCollectionRef, uniqueJobs)
    await updateNewJobs(jobsCollectionRef, uniqueJobs)
    await algolia(uniqueJobs)


}

const transfer_from_algolia_to_firestore = async () => {
    let hits = [];

    const client = algoliasearch('KCCE701SC2', '719a29d1dfb3929dd72afd2b3c35c3ab');
    const index = client.initIndex('thejobhunt');
    await index.browseObjects({
        query: '', // Empty query will match all records
        batch: batch => {
            hits = hits.concat(batch);
        }
    }).then(() => {
        hits.forEach(hit=> delete hit.objectID)
        const jobsCollectionRef = firebaseDB.collection("jobs");
        deleteOldJobs(jobsCollectionRef, hits)
            .then(()=>
                updateNewJobs(jobsCollectionRef, hits)
                    .then(()=>
                        console.log('stored'))
            )
    });

}

// commitJobs().then( res => console.log(res)).catch(err => console.log(err))
// transfer_from_algolia_to_firestore().then( res => console.log(res)).catch(err => console.log(err))

commitJobs();
