import axios from 'axios';
import cheerio from'cheerio';
export default async (test, query) => {
    const getData = async (url) => {
        const results = [];
        try{
            const response = await axios.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            const cards = $('article.JobCard');
            cards.each((_,card)=>{
                const $card = $(card);
                const title = $card.find('h2').text().trim();
                const company = $card.find('.JobCard-company').text().trim();
                const location = $card.find('.JobCard-location').text().replace("—","").trim();
                const created = new Date($card.find('time').attr('datetime'));
                const apply = `https://www.workopolis.com${$card.find('a').attr('href')}`;
                const id = $card.attr('data-jobkey');
                const source = "Workpolis";

                const data = {id, title, apply, location, company, created, source};
                results.push(data);
            })

        }catch(err){
            console.log(`ERROR : ${err.config.url}`);
        }
        return results;
    }
    const search = query.split(" ").join("+");
    let page = 1;
    let run = true;
    const jobs = [];
    while(run && page<50){
        const url = `https://www.workopolis.com/jobsearch/find-jobs?ak=${search}&l=Canada&lg=en&pn=${page}&st=true`;
        const results = await getData(url);
        if(results.length>0) jobs.push(...results)
        else run = false;
        if(test) run=false;
        page+=1;
    }
    console.log({
        query,
        source: 'Workspolis',
        results: jobs.length
    });
    return jobs;
}
