import axios from 'axios';

export default async (test, query) => {
    const getData = async (url) => {
        let results = [];
        try{
            const response = await axios.get(url);
            const data = response.data;
            const organicData = data.filter(res => !res.hasOwnProperty('InlineApasAd'))
            results =  organicData.map(job => ({
                id: job.musangKingId,
                title: job.Title,
                company: job.Company.Name,
                location: job.LocationText,
                created: new Date(job.DatePosted),
                apply: job.TitleLink,
                source: "Monster",
                query,
            }));

        }catch(err){
            console.log(`ERROR : ${err.config?.url || 'Monster API'}`);
        }

        return results;
    }
    const search = query.split(" ").join("-");
    let page = 1;
    let run = true;
    const jobs = [];
    while(run && (page*25)<1000){
        const url = `https://www.monster.ca/jobs/search/pagination/?q=${search}&tm=14&stpage=1&isDynamicPage=true&isMKPagination=true&page=${page}&total=${page*25}`;
        const results = await getData(url);
        if(results.length>0) jobs.push(...results)
        else run = false;
        if(test) run=false;
        page+=1;
    }
    console.log({
        query,
        source: 'Monster',
        results: jobs.length
    });
    return jobs;
}
