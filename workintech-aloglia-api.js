import axios from 'axios';

export default async (test, query) => {

    const jobs = [];
    const url ='https://su5v69fjoj-dsn.algolia.net/1/indexes/Job_628_production/query';
    const headers = {
        "Content-Type": "application/json",
        "x-algolia-api-key": "a4971670ebc5d269725bb3d7639f9c3d",
        "x-algolia-application-id": "SU5V69FJOJ"
    }
    let hits = 1000;
    if (test) hits = 20;
    const data = {
        "query": query,
        "hitsPerPage":hits,
        "attributesToRetrieve":["created_at","title","organization.name","locations","url"],
    };
    try {

        const res = await axios.post(url, data, {headers})
        const json = res.data;
        jobs.push(...json.hits.map(r => ({
            title: r.title,
            company: r.organization.name,
            location: r.locations.join(" "),
            created: new Date(r.created_at * 1000),
            apply: r.url,
            id: r.objectID,
            source: 'Workintech',
            query,
        })));
        console.log({
            query,
            source: 'workintech',
            results: jobs.length
        });
    }catch(err){
        console.log(`ERROR: ALGOLIA ${err}`)
    }
    return jobs;

};
